"use client";

import { useState, useMemo, useEffect } from "react";
import { processCrmCampaign } from "@/actions/admin/crm";
import { getClientMovements } from "@/actions/admin";
import { Users, Search, Target, Gift, Send, Filter, ShieldAlert, BadgeInfo, Plus, MessageCircle } from "lucide-react";
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
import { useModalStore } from "@/lib/modal-store";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

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
}

type FilterType = 'all' | 'vips' | 'absent' | 'hoarders';

export function CampaignsClient({ initialClients }: CampaignsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Detail Modal State
    const [selectedDetailClient, setSelectedDetailClient] = useState<any | null>(null);
    const [clientMovements, setClientMovements] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

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
    }, [initialClients, activeFilter, searchQuery]);

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
        return new Date(dateString).toLocaleDateString();
    };

    // Open Campaign Modal via Zustand
    const handleLaunchClick = () => {
        openModal("campaign_creator", { selectedIds });
    };

    // Resets selection after successful campaign
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
            toast.error("Error al cargar historial del cliente");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 flex flex-col h-[calc(100vh-4rem)] md:h-screen">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    Campañas CRM
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Gestión de puntos de regalo y notificaciones.
                </p>
            </div>

            {/* Top Action Bar exactly like Codes/Rewards */}
            <div className="flex flex-col sm:flex-row justify-start gap-4 items-start sm:items-center shrink-0">
                <Button
                    onClick={handleLaunchClick}
                    disabled={selectedIds.length === 0}
                    className="w-full sm:w-auto shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Campaña ({selectedIds.length})
                </Button>

                {initialClients.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="hidden sm:block w-px h-8 bg-border mx-1"></div>
                        <div className="relative w-full sm:w-64 -ml-2 sm:ml-0">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterType)}>
                            <SelectTrigger className="w-full sm:w-[150px]">
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
                                                        <span title="Bloqueó Mensajes de WhatsApp" className="flex items-center">
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

            <CampaignsModalController />

            {/* Client Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Perfil del Cliente</DialogTitle>
                    </DialogHeader>

                    {selectedDetailClient && (
                        <div className="space-y-6">
                            {/* Client Info Header */}
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

                            {/* Quick Actions */}
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
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center shadow-sm">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Registro</span>
                                    <span className="text-sm font-medium">{selectedDetailClient.createdAt ? new Date(selectedDetailClient.createdAt).toLocaleDateString("es-ES", { month: 'short', year: 'numeric' }) : "N/A"}</span>
                                </div>
                                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center shadow-sm">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Cumpleaños</span>
                                    <span className="text-sm font-medium">{selectedDetailClient.birthDate || "N/A"}</span>
                                </div>
                                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center shadow-sm">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Visitas</span>
                                    <span className="text-sm font-medium text-foreground">{selectedDetailClient.totalVisits || 0}</span>
                                </div>
                                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center shadow-sm">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Canjes</span>
                                    <span className="text-sm font-medium text-foreground">{selectedDetailClient.totalRedemptions || 0}</span>
                                </div>
                            </div>

                            {/* Movements History */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Search size={14} className="text-muted-foreground" />
                                    Historial Reciente
                                </h4>
                                <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {isLoadingHistory ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : clientMovements.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
                                            <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
                                        </div>
                                    ) : (
                                        clientMovements.map((mov) => (
                                            <div
                                                key={mov.id}
                                                className="flex items-start justify-between gap-3 p-3 bg-background hover:bg-muted/30 border rounded-lg transition-colors"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-foreground break-words leading-tight mb-1">
                                                        {mov.details}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                                        <span>{new Date(mov.date).toLocaleString("es-EC", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                        {mov.type === "redemption" && mov.status && (
                                                            <Badge
                                                                variant={
                                                                    mov.status === "approved"
                                                                        ? "default"
                                                                        : mov.status === "rejected"
                                                                            ? "destructive"
                                                                            : "outline"
                                                                }
                                                                className="text-[9px] px-1.5 py-0 uppercase h-4"
                                                            >
                                                                {mov.status === "approved"
                                                                    ? "Aprobado"
                                                                    : mov.status === "rejected"
                                                                        ? "Rechazado"
                                                                        : "Pendiente"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {mov.type !== "name_change" && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-sm shrink-0 font-bold border-transparent ${mov.points > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                                                    >
                                                        {mov.points > 0 ? "+" : ""}
                                                        {mov.points} pts
                                                    </Badge>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Global Controller for Responsive Modal
function CampaignsModalController() {
    const { activeModal, data, closeModal } = useModalStore();
    const isMobile = useIsMobile();

    if (activeModal !== "campaign_creator") return null;

    const selectedIds = data.selectedIds as number[];

    if (isMobile) {
        return (
            <Drawer open={true} onOpenChange={(open) => !open && closeModal()}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Asistente de Campaña</DrawerTitle>
                    </DrawerHeader>
                    <CampaignFormContent selectedIds={selectedIds} onClose={closeModal} />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Asistente de Campaña (A {selectedIds.length} clientes)</DialogTitle>
                </DialogHeader>
                <CampaignFormContent selectedIds={selectedIds} onClose={closeModal} />
            </DialogContent>
        </Dialog>
    );
}

// Inner Content logic to avoid duplication between Dialog and Drawer
function CampaignFormContent({ selectedIds, onClose }: { selectedIds: number[], onClose: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [enablePoints, setEnablePoints] = useState(false);
    const [giftPoints, setGiftPoints] = useState<number>(0);
    const [enableMessage, setEnableMessage] = useState(true);
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [msgImageUrl, setMsgImageUrl] = useState("");

    const handleLaunchCampaign = async () => {
        if (!enablePoints && !enableMessage) {
            toast.error("Debes elegir al menos una acción (Regalar Puntos o Enviar Mensaje)");
            return;
        }

        if (enablePoints && giftPoints <= 0) {
            toast.error("La cantidad de puntos a regalar debe ser mayor a 0");
            return;
        }

        if (enableMessage && (!msgTitle.trim() || !msgBody.trim())) {
            toast.error("El titulo y cuerpo del mensaje son obligatorios si activas la casilla");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await processCrmCampaign(selectedIds, {
                pointsToGift: enablePoints ? giftPoints : 0,
                sendMessage: enableMessage,
                title: msgTitle,
                body: msgBody,
                imageUrl: msgImageUrl || undefined
            });

            if (res.success) {
                toast.success("Campaña ejecutada exitosamente");
                window.dispatchEvent(new Event("campaign_done"));
                onClose();
            } else {
                toast.error(res.error || "Ocurrio un error critico en la transaccon");
            }
        } catch (error) {
            toast.error("Fallo la comunicacion con el servidor");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Título</label>
                <Input
                    placeholder="Ej: ¡Nuevo descuento especial!"
                    value={msgTitle}
                    onChange={e => setMsgTitle(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mensaje</label>
                <Textarea
                    className="min-h-[100px]"
                    placeholder="Escribe el cuerpo del mensaje..."
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">URL de Imagen (Opcional, para WhatsApp)</label>
                <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={msgImageUrl}
                    onChange={e => setMsgImageUrl(e.target.value)}
                />
            </div>
            <div className="space-y-3 pt-2">
                <label className="text-sm font-medium text-foreground">Acciones de Campaña</label>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                        <Send size={16} className="text-foreground" />
                        <span className="text-sm">Push de Mensaje (In-App y WhatsApp)</span>
                    </div>
                    <Checkbox
                        checked={enableMessage}
                        onCheckedChange={(checked) => setEnableMessage(checked === true)}
                    />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2">
                        <Gift size={16} className="text-foreground" />
                        <span className="text-sm flex items-center gap-2">
                            Acreditar Puntos:
                            <Input
                                type="number"
                                className="w-20 h-8 ml-2 bg-background"
                                value={giftPoints || ''}
                                onChange={(e) => setGiftPoints(Number(e.target.value))}
                                disabled={!enablePoints}
                                placeholder="Cant."
                            />
                        </span>
                    </div>
                    <Checkbox
                        checked={enablePoints}
                        onCheckedChange={(checked) => setEnablePoints(checked === true)}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                <Button onClick={handleLaunchCampaign} disabled={isProcessing || (!enablePoints && !enableMessage)}>
                    {isProcessing ? "Enviando..." : "Enviar Ahora"}
                </Button>
            </div>
        </div>
    );
}
