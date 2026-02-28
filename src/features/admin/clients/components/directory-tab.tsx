"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Eye, ChevronRight } from "lucide-react";
import { useModalStore } from "@/lib/modal-store";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ClientsDirectoryTabProps {
    clients: any[];
}

export function ClientsDirectoryTab({ clients }: ClientsDirectoryTabProps) {
    const { openModal } = useModalStore();
    const [clientFilter, setClientFilter] = useState("");

    const filteredClients = useMemo(() => {
        if (!clientFilter.trim()) return clients;
        const q = clientFilter.toLowerCase().trim();
        return clients.filter((c) =>
            c.username.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
    }, [clients, clientFilter]);

    return (
        <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o celular..."
                            className="pl-9 h-10 bg-muted/30 border-none shadow-inner"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" className="h-10 px-4">
                            <Filter size={16} className="mr-2" />
                            Filtros
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                            <TableHead className="w-[300px] h-12">Cliente</TableHead>
                            <TableHead className="hidden md:table-cell h-12">Celular</TableHead>
                            <TableHead className="text-center h-12">Balance</TableHead>
                            <TableHead className="hidden lg:table-cell h-12">Miembro desde</TableHead>
                            <TableHead className="text-right pr-6 h-12">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    No se encontraron clientes que coincidan con la búsqueda.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id} className="group hover:bg-muted/50 transition-colors border-none">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-border shadow-sm">
                                                <AvatarImage src={`/avatars/${client.avatarSvg}`} />
                                                <AvatarFallback>{client.username[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-foreground truncate">{client.username}</span>
                                                <span className="text-xs text-muted-foreground lg:hidden">{client.phone}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground font-medium">
                                        {client.phone}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-mono text-primary font-bold px-3 py-1">
                                            {client.points.toLocaleString()} pts
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                        {new Date(client.createdAt).toLocaleDateString("es-EC", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openModal("client-detail", { client })}
                                        >
                                            <Eye size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
