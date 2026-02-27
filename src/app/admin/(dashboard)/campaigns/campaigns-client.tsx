"use client";

import { useState, useMemo, useEffect } from "react";
import { processCrmCampaign, createClientGroup, deleteClientGroup, assignClientsToGroup, removeClientsFromGroup } from "@/actions/admin/crm";
import { getClientMovements } from "@/actions/admin";
import { Users, Search, Target, Gift, Send, Filter, ShieldAlert, BadgeInfo, Plus, MessageCircle, MoreVertical, Trash, Tag } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModalStore } from "@/lib/modal-store";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";

export type CrmClient = {
    id: number;
    username: string;
    phone: string;
    avatarSvg: string | null;
    points: number;
    wantsMarketing: boolean;
    wantsTransactional: boolean;
    wantsInAppNotifs: boolean;
    createdAt: Date;
    totalVisits: number;
    lastVisit: string | null;
    totalRedemptions: number;
};

interface CampaignsClientProps {
    initialClients: any[];
    initialGroups: any[];
    initialMemberships: any[];
}

type FilterType = 'all' | 'vips' | 'absent' | 'hoarders' | string;

export function CampaignsClient({ initialClients, initialGroups, initialMemberships }: CampaignsClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Detail Modal State
    const [selectedDetailClient, setSelectedDetailClient] = useState<any | null>(null);
    const [clientMovements, setClientMovements] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Grupos State
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    // Asignar al grupo Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignTargetGroup, setAssignTargetGroup] = useState<string>("");

    // Modal Global Store
    const { openModal } = useModalStore();

    const filteredClients = useMemo(() => {
        const now = new Date();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        let result = initialClients;

        switch (activeFilter) {
            case 'vips':
                result = result.filter(c => c.totalVisits >= 3);
                break;
            case 'absent':
                result = result.filter(c => {
                    const lastDate = c.lastVisit ? new Date(c.lastVisit) : new Date(c.createdAt);
                    return (now.getTime() - lastDate.getTime()) > THIRTY_DAYS;
                });
                break;
            case 'hoarders':
                result = result.filter(c => c.points >= 30 && c.totalRedemptions === 0);
                break;
            default:
                if (activeFilter.startsWith('group_')) {
                    const groupId = Number(activeFilter.replace('group_', ''));
                    const memberIds = new Set(initialMemberships.filter((m: any) => m.groupId === groupId).map((m: any) => m.clientId));
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
    }, [initialClients, activeFilter, searchQuery, initialMemberships]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredClients.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectClient = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(vid => vid !== id));
        }
    };

    const formatLastVisit = (dateString: string | null) => {
        if (!dateString) return "Nunca";
        return new Date(dateString).toLocaleDateString("es-EC");
    };

    const handleLaunchClick = () => {
        const theSelectedClients = filteredClients.filter(c => selectedIds.includes(c.id));
        openModal("campaign_creator", { selectedIds, selectedClients: theSelectedClients });
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsCreatingGroup(true);
        try {
            await createClientGroup(newGroupName);
            setNewGroupName("");
            toast.success("Grupo creado exitosamente");
            router.refresh();
        } catch {
            toast.error("Error al crear grupo");
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        try {
            await deleteClientGroup(id);
            if (activeFilter === `group_${id}`) {
                setActiveFilter('all');
            }
            toast.success("Grupo eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar grupo");
        }
    };

    const handleAssignToGroup = async () => {
        if (!assignTargetGroup) return;
        setIsAssigning(true);
        try {
            await assignClientsToGroup(Number(assignTargetGroup), selectedIds);
            toast.success("Clientes asignados al grupo");
            setSelectedIds([]);
            setShowAssignModal(false);
            setAssignTargetGroup("");
            router.refresh();
        } catch {
            toast.error("Error al asignar clientes");
        } finally {
            setIsAssigning(false);
        }
    };

    useEffect(() => {
        const handleCampaignDone = () => {
            setSelectedIds([]);
        };
        window.addEventListener("campaign_done", handleCampaignDone);
        return () => window.removeEventListener("campaign_done", handleCampaignDone);
    }, []);

    const handleClientClick = async (client: any) => {
        setSelectedDetailClient(client);
        setShowDetailModal(true);
        setIsLoadingHistory(true);
        try {
            const movements = await getClientMovements(client.id);
            setClientMovements(movements);
        } catch {
            toast.error("Error al cargar historial");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    return (
        <div className="space-y-6 flex flex-col flex-1 min-h-0">

            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center shrink-0">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                        onClick={handleLaunchClick}
                        disabled={selectedIds.length === 0}
                        className="shrink-0 font-bold"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Crear Campaña ({selectedIds.length})
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" disabled={selectedIds.length === 0} className="shrink-0 gap-2">
                                <Users size={16} />
                                Mover a Grupo
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setShowAssignModal(true)}>
                                Asignar a un Grupo Existente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="secondary" onClick={() => setShowGroupsModal(true)} className="gap-2 shrink-0">
                        <Tag size={16} />
                        Gestionar Grupos
                    </Button>
                </div>

                {initialClients.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
                            <SelectTrigger className="w-full sm:w-[170px]">
                                <SelectValue placeholder="Audiencia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <div className="flex items-center gap-2"><Users size={14} />Todos</div>
                                </SelectItem>
                                <SelectItem value="vips">
                                    <div className="flex items-center gap-2"><Target size={14} />VIPs</div>
                                </SelectItem>
                                <SelectItem value="absent">
                                    <div className="flex items-center gap-2"><Search size={14} />Ausentes</div>
                                </SelectItem>
                                <SelectItem value="hoarders">
                                    <div className="flex items-center gap-2"><Gift size={14} />Acumuladores</div>
                                </SelectItem>
                                {initialGroups.length > 0 && (
                                    <>
                                        <div className="h-px bg-border my-2" />
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">Grupos Creados</div>
                                        {initialGroups.map((g: any) => (
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
                )}
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto rounded-xl border bg-card relative">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 border-b">
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[60px] pl-4 sm:pl-6 text-center h-12">
                                <Checkbox
                                    checked={filteredClients.length > 0 && selectedIds.length === filteredClients.length}
                                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                />
                            </TableHead>
                            <TableHead className="w-[200px] sm:w-[300px] font-semibold h-12">Identidad</TableHead>
                            <TableHead className="text-center font-semibold h-12">Métricas de Actividad</TableHead>
                            <TableHead className="text-right pr-4 sm:pr-8 font-semibold h-12">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                                    <Filter size={48} className="mx-auto mb-4 opacity-20" />
                                    No hay clientes en este segmento.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map(client => (
                                <TableRow key={client.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleClientClick(client)}>
                                    <TableCell className="pl-4 sm:pl-6 text-center py-4" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.includes(client.id)}
                                            onCheckedChange={(checked) => handleSelectClient(client.id, checked === true)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={`/avatars/${client.avatarSvg}`}
                                                alt={client.username}
                                                className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                                            />
                                            <div>
                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                    {client.username}
                                                    {!client.wantsMarketing && (
                                                        <span title="Bloqueó Mensajes de Marketing" className="flex items-center">
                                                            <ShieldAlert size={14} className="text-muted-foreground" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {client.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-6 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Visitas</span>
                                                <Badge variant="secondary" className="w-fit">{client.totalVisits}</Badge>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Canjes</span>
                                                <Badge variant="secondary" className="w-fit">{client.totalRedemptions}</Badge>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Reciente</span>
                                                <span className="font-medium">{formatLastVisit(client.lastVisit)}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-4 sm:pr-8">
                                        <Badge variant="default" className="font-bold text-sm px-3 shadow-sm bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                            {client.points} pts
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modals Extras */}
            <Dialog open={showGroupsModal} onOpenChange={setShowGroupsModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gestionar Grupos de Clientes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nombre del nuevo grupo..."
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                            <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
                                <Plus size={16} className="mr-2" />
                                Añadir
                            </Button>
                        </div>
                        <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto">
                            {initialGroups.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">No has creado ningún grupo todavía.</p>
                            ) : (
                                initialGroups.map(group => (
                                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                        <div>
                                            <h4 className="font-medium">{group.name}</h4>
                                            <p className="text-xs text-muted-foreground">Id: {group.id}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteGroup(group.id)}>
                                            <Trash size={16} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar a Grupo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Asignarás {selectedIds.length} clientes a este grupo.
                        </p>
                        <Select value={assignTargetGroup} onValueChange={setAssignTargetGroup}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un grupo destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {initialGroups.map(g => (
                                    <SelectItem key={g.id.toString()} value={g.id.toString()}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssignModal(false)} disabled={isAssigning}>Cancelar</Button>
                            <Button onClick={handleAssignToGroup} disabled={!assignTargetGroup || isAssigning}>
                                Confirmar Asignación
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <CampaignsModalController />

            {/* Client Detail Modal - Drawer on mobile, Dialog on desktop */}
            <ClientDetailController
                showDetailModal={showDetailModal}
                setShowDetailModal={setShowDetailModal}
                selectedDetailClient={selectedDetailClient}
                activeFilter={activeFilter}
                isLoadingHistory={isLoadingHistory}
                clientMovements={clientMovements}
            />
        </div>
    );
}

function CampaignsModalController() {
    const { activeModal, data, closeModal } = useModalStore();
    if (activeModal !== "campaign_creator") return null;
    const selectedIds = data.selectedIds as number[];

    return (
        <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asistente de Campaña ({selectedIds.length} clientes)</DialogTitle>
                </DialogHeader>
                <CampaignFormContent selectedClients={data.selectedClients as CrmClient[]} onClose={closeModal} />
            </DialogContent>
        </Dialog>
    );
}

function CampaignFormContent({ selectedClients, onClose }: { selectedClients: CrmClient[], onClose: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [enablePoints, setEnablePoints] = useState(false);
    const [giftPoints, setGiftPoints] = useState<number>(0);
    const hasAnyNoMarketing = selectedClients.some(c => !c.wantsMarketing);
    const [enableMessage, setEnableMessage] = useState(!hasAnyNoMarketing);
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [msgImageUrl, setMsgImageUrl] = useState("");

    const handleLaunchCampaign = async () => {
        if (!msgTitle.trim() || !msgBody.trim()) {
            toast.error("El Título y Descripción son obligatorios.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await processCrmCampaign(selectedClients.map(c => c.id), {
                pointsToGift: enablePoints ? giftPoints : 0,
                sendMessage: enableMessage,
                title: msgTitle.trim(),
                body: msgBody.trim(),
                imageUrl: msgImageUrl || undefined
            });

            if (res.success) {
                toast.success("Campaña ejecutada exitosamente");
                window.dispatchEvent(new Event("campaign_done"));
                onClose();
            } else {
                toast.error(res.error || "Error crítico");
            }
        } catch {
            toast.error("Fallo comunicación");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Título (Obligatorio)</label>
                <Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Ej. ¡Feliz Aniversario!" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje (Obligatorio)</label>
                <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Ej. Tienes un regalo especial esperándote. Muéstranos este mensaje." />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">URL de Imagen (Opcional para WhatsApp)</label>
                <Input value={msgImageUrl} onChange={e => setMsgImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-3 pt-2">
                <div className={`p-3 bg-muted/50 rounded-lg border ${hasAnyNoMarketing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2 font-semibold"><MessageCircle size={16} className="text-[#25D366]" />Enviar por WhatsApp</span>
                        <Checkbox checked={enableMessage} onCheckedChange={(checked) => setEnableMessage(checked === true)} disabled={hasAnyNoMarketing} />
                    </div>
                    {hasAnyNoMarketing && (
                        <p className="text-xs text-warning font-medium mt-2">
                            Deshabilitado: Al menos un cliente destino no permite envíos de marketing de WhatsApp.
                        </p>
                    )}
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2 font-semibold"><Gift size={16} className="text-primary" />Acreditar Puntos</span>
                        <Checkbox checked={enablePoints} onCheckedChange={(checked) => setEnablePoints(checked === true)} />
                    </div>
                    {enablePoints && (
                        <Input type="number" value={giftPoints || ''} onChange={(e) => setGiftPoints(Number(e.target.value))} placeholder="Cantidad de puntos" />
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                <Button onClick={handleLaunchCampaign} disabled={isProcessing}>Enviar Ahora</Button>
            </DialogFooter>
        </div>
    );
}

function ClientDetailController({ showDetailModal, setShowDetailModal, selectedDetailClient, activeFilter, isLoadingHistory, clientMovements }: {
    showDetailModal: boolean;
    setShowDetailModal: (v: boolean) => void;
    selectedDetailClient: any | null;
    activeFilter: string;
    isLoadingHistory: boolean;
    clientMovements: any[];
}) {
    const isMobile = useIsMobile();

    const content = selectedDetailClient ? (
        <div className="space-y-6 px-4 pb-6 sm:px-0 sm:pb-0">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <img
                    src={`/avatars/${selectedDetailClient.avatarSvg}`}
                    alt={selectedDetailClient.username}
                    className="w-16 h-16 rounded-full border-2 border-border object-cover shrink-0 bg-background"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/avatars/default.svg";
                    }}
                />
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl text-foreground truncate flex items-center gap-2">
                        {selectedDetailClient.username}
                        {!selectedDetailClient.wantsMarketing && (
                            <span title="No desea recibir marketing">
                                <ShieldAlert size={16} className="text-warning" />
                            </span>
                        )}
                    </h3>
                    <p className="font-mono text-sm text-muted-foreground mt-0.5">
                        {selectedDetailClient.phone}
                    </p>
                </div>
                <div className="text-right">
                    <Badge variant="default" className="text-lg px-4 py-1 bg-primary/10 text-primary border-primary/20">
                        {selectedDetailClient.points} pts
                    </Badge>
                </div>
            </div>
            <div className="flex gap-2">
                <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                    <a
                        href={`https://wa.me/593${selectedDetailClient.phone.slice(1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contactar por WhatsApp
                    </a>
                </Button>
                {activeFilter.startsWith('group_') && (
                    <Button variant="destructive" onClick={async () => {
                        const gid = Number(activeFilter.replace('group_', ''));
                        await removeClientsFromGroup(gid, [selectedDetailClient.id]);
                        toast.success("Removido del grupo");
                        setShowDetailModal(false);
                    }}>
                        Remover de Grupo
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Registro</span>
                    <span className="text-sm font-medium">{selectedDetailClient.createdAt ? new Date(selectedDetailClient.createdAt).toLocaleDateString("es-EC") : "N/A"}</span>
                </div>
            </div>
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">Historial Reciente</h4>
                <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-2">
                    {isLoadingHistory ? (
                        <p>Cargando...</p>
                    ) : clientMovements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin movimientos.</p>
                    ) : (
                        clientMovements.map((mov) => (
                            <div key={mov.id} className="flex justify-between p-3 border rounded-lg">
                                <div className="text-sm">{mov.details}</div>
                                <Badge variant="outline">{mov.points} pts</Badge>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    ) : null;

    if (isMobile) {
        return (
            <Drawer open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle>Perfil del Cliente</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[75vh]">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Perfil del Cliente</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}
