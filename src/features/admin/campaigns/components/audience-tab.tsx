"use client";

import { useState, useMemo } from "react";
import {
    Users,
    Search,
    Target,
    Gift,
    Send,
    Filter,
    ShieldAlert,
    BadgeInfo,
    CalendarDays,
    Eye,
    ChevronRight,
} from "lucide-react";
import { useModalStore } from "@/lib/modal-store";
import { getClientMovements } from "@/actions/admin";
import { toast } from "@/lib/toast";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type FilterType = 'all' | 'vips' | 'absent' | 'hoarders' | string;

interface AudienceTabProps {
    clients: any[];
    groups: any[];
    memberships: any[];
    selectedIds: number[];
    setSelectedIds: (ids: number[] | ((prev: number[]) => number[])) => void;
    onLaunch: () => void;
    onClientDetail: (client: any, activeFilter: string) => void;
}

export function AudienceTab({
    clients,
    groups,
    memberships,
    selectedIds,
    setSelectedIds,
    onLaunch,
    onClientDetail,
}: AudienceTabProps) {
    const { openModal } = useModalStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    const filteredClients = useMemo(() => {
        const now = new Date();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        let result = clients;

        switch (activeFilter) {
            case 'vips':
                result = result.filter(c => c.codesRedeemed >= 3);
                break;
            case 'absent':
                result = result.filter(c => {
                    const lastDate = c.lastLoginAt ? new Date(c.lastLoginAt) : new Date(c.createdAt);
                    return (now.getTime() - lastDate.getTime()) > THIRTY_DAYS;
                });
                break;
            case 'hoarders':
                result = result.filter(c => c.points >= 30 && c.totalRedemptions === 0);
                break;
            default:
                if (activeFilter.startsWith('group_')) {
                    const groupId = Number(activeFilter.replace('group_', ''));
                    const memberIds = new Set(memberships.filter((m: any) => m.groupId === groupId).map((m: any) => m.clientId));
                    result = result.filter(c => memberIds.has(c.id));
                }
                break;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(c =>
                c.username.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        return result;
    }, [clients, activeFilter, searchQuery, memberships]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredClients.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectClient = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev: number[]) => [...prev, id]);
        } else {
            setSelectedIds((prev: number[]) => prev.filter(vid => vid !== id));
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <Card className="border-none shadow-sm bg-card/50">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                onClick={onLaunch}
                                disabled={selectedIds.length === 0}
                                className="font-bold shadow-lg shadow-primary/20"
                            >
                                <Send size={16} className="mr-2" />
                                Crear Campaña ({selectedIds.length})
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={selectedIds.length === 0} className="gap-2">
                                        <Users size={16} />
                                        Mover a Grupo
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={() => openModal("assign_group", { selectedIds })}>
                                        Asignar a un Grupo Existente
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-stretch sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre o celular..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 bg-background/50 border-none"
                                />
                            </div>
                            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
                                <SelectTrigger className="w-full sm:w-[180px] h-10">
                                    <SelectValue placeholder="Segmento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2"><Users size={14} />Todos</div>
                                    </SelectItem>
                                    <SelectItem value="vips">
                                        <div className="flex items-center gap-2"><Target size={14} />VIPs (3+ canjes)</div>
                                    </SelectItem>
                                    <SelectItem value="absent">
                                        <div className="flex items-center gap-2"><CalendarDays size={14} />Ausentes (+30d)</div>
                                    </SelectItem>
                                    <SelectItem value="hoarders">
                                        <div className="flex items-center gap-2"><Gift size={14} />Acumuladores</div>
                                    </SelectItem>
                                    {groups.length > 0 && (
                                        <>
                                            <div className="h-px bg-border my-2" />
                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Grupos Creados</div>
                                            {groups.map((g: any) => (
                                                <SelectItem key={`group_${g.id}`} value={`group_${g.id}`}>
                                                    <div className="flex items-center gap-2">
                                                        <BadgeInfo size={14} className="text-primary" />{g.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                                <TableHead className="w-[60px] pl-4 sm:pl-6 text-center h-12">
                                    <Checkbox
                                        checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                    />
                                </TableHead>
                                <TableHead className="w-[250px] h-12">Cliente</TableHead>
                                <TableHead className="hidden md:table-cell text-center h-12">Actividad</TableHead>
                                <TableHead className="text-center h-12">Balance</TableHead>
                                <TableHead className="text-right pr-6 h-12">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                        <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No hay clientes en este segmento.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map(client => (
                                    <TableRow key={client.id} className="group hover:bg-muted/50 transition-colors border-none">
                                        <TableCell className="pl-4 sm:pl-6 text-center py-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(client.id)}
                                                onCheckedChange={(checked) => handleSelectClient(client.id, checked === true)}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                    <AvatarImage src={`/avatars/${client.avatarSvg}`} />
                                                    <AvatarFallback>{client.username[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                                        {client.username}
                                                        {!client.wantsMarketing && (
                                                            <span title="No permite mensajes de marketing">
                                                                <ShieldAlert size={14} className="text-muted-foreground" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground font-mono">{client.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center justify-center gap-6 text-sm">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Códigos</span>
                                                    <Badge variant="secondary" className="text-xs">{client.codesRedeemed}</Badge>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Canjes</span>
                                                    <Badge variant="secondary" className="text-xs">{client.totalRedemptions}</Badge>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">Últ. Acceso</span>
                                                    <span className="text-xs font-medium">{client.lastLoginAt ? new Date(client.lastLoginAt).toLocaleDateString("es-EC", { day: 'numeric', month: 'short' }) : "Nunca"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold px-3 py-1">
                                                {client.points.toLocaleString()} pts
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => onClientDetail(client, activeFilter)}
                                            >
                                                <Eye size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full ml-1"
                                                onClick={() => onClientDetail(client, activeFilter)}
                                            >
                                                <ChevronRight size={18} className="text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
