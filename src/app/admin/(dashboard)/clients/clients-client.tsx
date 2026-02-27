/**
 * admin/clients/clients-client.tsx
 * Descripcion: Componente cliente para listado de clientes con modal de detalle
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-22
 * Descripcion: Tabla simplificada (usuario+puntos), click abre modal con info completa e historial
 */

import { useState, useMemo, useEffect } from "react";
import { deleteClient, searchRedemptionTicket, getClientMovements, approveRedemption, rejectRedemption, blockClient, unblockClient } from "@/actions/admin";
import { useRouter, useSearchParams } from "next/navigation";
import { useModalStore } from "@/lib/modal-store";
import { Users, Trash2, MessageCircle, Search, ShieldCheck, Check, X, Gift, Download, Ban, Unlock, Crown, Star, Sparkles, Trophy } from "lucide-react";
import { toast } from "@/lib/toast";

const getTierStyle = (lifetimePoints: number) => {
    // Definimos los thresholds
    const thresholds = { none: 0, bronze: 50, silver: 200, gold: 500, vip: 1000 };

    if (lifetimePoints >= thresholds.vip) {
        return {
            name: "Ultimate VIP",
            badge: "bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/40",
            icon: <Sparkles size={14} className="text-red-600 dark:text-red-500" />,
        };
    }
    if (lifetimePoints >= thresholds.gold) {
        return {
            name: "Oro",
            badge: "bg-yellow-400/20 text-amber-500 dark:text-yellow-400 border-yellow-400/40",
            icon: <Star size={14} className="text-amber-500 dark:text-yellow-400" />,
        };
    }
    if (lifetimePoints >= thresholds.silver) {
        return {
            name: "Plata",
            badge: "bg-blue-400/20 text-blue-500 dark:text-blue-400 border-blue-400/30",
            icon: <Trophy size={14} className="text-blue-500 dark:text-blue-400" />,
        };
    }
    if (lifetimePoints >= thresholds.bronze) {
        return {
            name: "Bronce",
            badge: "bg-[#CD7F32]/20 text-[#CD7F32] border-[#CD7F32]/30",
            icon: <Trophy size={14} className="text-[#CD7F32]" />,
        };
    }

    return {
        name: "Ninguno",
        badge: "bg-primary/10 text-primary border-primary/20",
        icon: <Trophy size={14} className="text-primary" />,
    };
};

const formatEcuadorDate = (date: Date) => {
    return date.toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace('.', '').replace('.', ''); // Fix a.m./p.m. punctuation if needed or keep clean
};
import type { Client, Redemption } from "@/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface ClientsClientProps {
    initialClients: any[];
    initialPendingRedemptions: any[];
}

export function ClientsClient({ initialClients, initialPendingRedemptions }: ClientsClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [ticketResults, setTicketResults] = useState<Redemption[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Pending Redemptions
    const [pendingRedemptions, setPendingRedemptions] = useState(initialPendingRedemptions || []);
    const [isProcessingAct, setIsProcessingAct] = useState<number | null>(null);

    // Dashboard Cards State
    const [activeModal, setActiveModal] = useState<"checker" | "pending" | "clients" | null>(null);

    // Client Detail Modal
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [clientMovements, setClientMovements] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Delete Confirmation
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Block Confirmation
    const [blockId, setBlockId] = useState<number | null>(null);
    const [blockReason, setBlockReason] = useState("");

    // Client Search/Filter
    const [clientFilter, setClientFilter] = useState("");

    // Modal Store
    const { isOpen, openModal, closeModal, data } = useModalStore();
    const [rejectReason, setRejectReason] = useState("");

    // Highlight from URL params (from /admin/codes click)
    const searchParams = useSearchParams();
    const [highlightCode, setHighlightCode] = useState<string | null>(null);

    // Auto-open client detail from URL params
    useEffect(() => {
        const highlightId = searchParams.get("highlight");
        const code = searchParams.get("code");
        if (highlightId && initialClients.length > 0) {
            const client = initialClients.find(c => c.id === Number(highlightId));
            if (client) {
                if (code) setHighlightCode(code);
                // Auto-open the client's detail
                handleClientClick(client);
                // Clean URL params
                window.history.replaceState({}, "", "/admin/clients");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, initialClients]);

    const filteredClients = useMemo(() => {
        if (!clientFilter.trim()) return initialClients;
        const q = clientFilter.toLowerCase().trim();
        return initialClients.filter((c) => {
            const matchUser = c.username.toLowerCase().includes(q);
            const matchPhone = c.phone.includes(q);
            const matchDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" }).toLowerCase().includes(q)
                : false;
            return matchUser || matchPhone || matchDate;
        });
    }, [initialClients, clientFilter]);

    const handleTicketSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchRedemptionTicket(searchQuery.trim());
            setTicketResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    const handleApproveRedemption = async (id: number) => {
        setIsProcessingAct(id);
        try {
            await approveRedemption(id);
            setPendingRedemptions(prev => prev.filter((p: any) => p.id !== id));
            toast.success("Canje aprobado exitosamente");
            router.refresh();
        } catch (error) {
            toast.error("Error al aprobar canje");
        } finally {
            setIsProcessingAct(null);
        }
    };

    const handleRejectRedemption = (id: number) => {
        setRejectReason("");
        openModal("reject-redemption", { redemptionId: id });
    };

    const confirmRejectRedemption = async () => {
        const id = data.redemptionId as number;
        if (!id) return;

        setIsProcessingAct(id);
        closeModal();
        try {
            await rejectRedemption(id, rejectReason || undefined);
            setPendingRedemptions(prev => prev.filter((p: any) => p.id !== id));
            toast.success("Canje rechazado y puntos devueltos al cliente");
            router.refresh();
        } catch (error) {
            toast.error("Error al rechazar canje");
        } finally {
            setIsProcessingAct(null);
            setRejectReason("");
        }
    };

    const handleExportCSV = () => {
        if (!initialClients.length) {
            toast.error("No hay clientes para exportar");
            return;
        }

        const headers = ["ID", "Usuario", "Teléfono", "Puntos Actuales", "Puntos Historicos", "Fecha de Nacimiento", "Referido Por", "Accesos Referidos", "Fecha Creacion", "Inicios Sesión", "Último Acceso", "Códigos Canjeados", "Canjes Premios"];

        const rows = initialClients.map(c => [
            c.id,
            c.username,
            c.phone,
            c.points,
            c.lifetimePoints || 0,
            c.birthDate || "N/A",
            c.referredBy || "N/A",
            c.referralCount || 0,
            c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-EC") : "N/A",
            c.loginCount || 0,
            c.lastLoginAt ? formatEcuadorDate(new Date(c.lastLoginAt)) : "N/A",
            c.codesRedeemed || 0,
            c.totalRedemptions || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(row => row.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `clientes_zingy_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Archivo CSV generado exitosamente");
    };

    const handleClientClick = async (client: Client) => {
        setSelectedClient(client);
        setShowDetailModal(true);
        setIsLoadingHistory(true);
        try {
            const movements = await getClientMovements(client.id);
            setClientMovements(movements);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteClient(deleteId);
        setDeleteId(null);
        setShowDetailModal(false);
        toast.success("Cliente eliminado");
        router.refresh();
    };

    const handleBlock = async () => {
        if (!blockId) return;
        if (!blockReason.trim()) {
            toast.error("Debes ingresar un motivo para bloquear la cuenta.");
            return;
        }
        await blockClient(blockId, blockReason.trim());
        setBlockId(null);
        setBlockReason("");
        setShowDetailModal(false);
        toast.success("Cuenta bloqueada exitosamente");
        router.refresh();
    };

    const handleUnblock = async (id: number) => {
        await unblockClient(id);
        setShowDetailModal(false);
        toast.success("Cuenta desbloqueada exitosamente");
        router.refresh();
    };

    const statusConfig = (status: string) => {
        switch (status) {
            case "approved":
                return { label: "Aprobado", variant: "default" as const };
            case "rejected":
                return { label: "Rechazado", variant: "destructive" as const };
            default:
                return { label: "Pendiente", variant: "outline" as const };
        }
    };

    return (
        <>
            {/* Dashboard Cards (Kanban Style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => setActiveModal('checker')} className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-yellow-500/50 hover:shadow-lg transition-all flex flex-col items-center text-center gap-4 group">
                    <div className="p-4 bg-warning/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <ShieldCheck size={40} className="text-warning" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Comprobador Antifraude</h3>
                        <p className="text-sm text-muted-foreground mt-1">Verifica tickets escaneados</p>
                    </div>
                </div>

                <div onClick={() => setActiveModal('pending')} className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all flex flex-col items-center text-center gap-4 group relative overflow-hidden">
                    <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Gift className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Canjes Pendientes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Autoriza o rechaza solicitudes</p>
                    </div>
                    {pendingRedemptions.length > 0 && (
                        <div className="absolute top-4 right-4 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-lg">
                            {pendingRedemptions.length}
                        </div>
                    )}
                </div>

                <div onClick={() => setActiveModal('clients')} className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-blue-500/50 hover:shadow-lg transition-all flex flex-col items-center text-center gap-4 group">
                    <div className="p-4 bg-info/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Users size={40} className="text-info" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">Directorio de Clientes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Base de datos ({initialClients.length} usuarios)</p>
                    </div>
                </div>
            </div>

            {/* Modal: Comprobador Antifraude */}
            <Dialog open={activeModal === 'checker'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-warning" />
                            Comprobador (Antifraude)
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mb-2">
                        <Input
                            placeholder="Buscar ticket UUID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleTicketSearch()}
                        />
                        <Button
                            onClick={handleTicketSearch}
                            disabled={isSearching}
                            variant="secondary"
                        >
                            <Search />
                        </Button>
                    </div>
                    {ticketResults && (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                            {ticketResults.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-6">
                                    No se encontraron canjes con ese ticket.
                                </p>
                            ) : (
                                ticketResults.map((r) => {
                                    const sc = statusConfig(r.status);
                                    return (
                                        <div
                                            key={r.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card border border-border rounded-lg gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs text-muted-foreground truncate">
                                                    {r.ticketUuid}
                                                </p>
                                                <p className="text-sm font-medium text-foreground mt-1">
                                                    Puntos Deduccidos: {r.pointsSpent} pts
                                                </p>
                                            </div>
                                            <Badge variant={sc.variant}>{sc.label}</Badge>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal: Canjes Pendientes */}
            <Dialog open={activeModal === 'pending'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-3xl flex flex-col max-h-[85vh] overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-primary" />
                            Canjes Pendientes de Autorización
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto custom-scrollbar p-6 pt-2 shrink flex-1 space-y-3">
                        {pendingRedemptions.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground bg-accent/30 rounded-xl border border-dashed">
                                <Check size={48} className="mx-auto mb-4 opacity-50 text-success" />
                                <p className="text-lg font-medium">No hay canjes pendientes</p>
                                <p className="text-sm opacity-80 mt-1">Todo está al día</p>
                            </div>
                        ) : (
                            pendingRedemptions.map(red => {
                                // Encontrar al cliente en initialClients
                                const existingClient = initialClients.find(c => c.id === red.clientId);

                                return (
                                    <div
                                        key={red.id}
                                        className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-card border border-border rounded-xl gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                        onClick={() => {
                                            if (existingClient) {
                                                setActiveModal("clients"); // Switch context silently
                                                handleClientClick(existingClient);
                                                // The auto-scroll relies on the ticket being in details
                                                setHighlightCode(red.ticketUuid.split('-')[0]); // We use the short prefix just in case, but let's use the whole UUID if possible. Actually movement details contains the word "Ticket: UUID"
                                                // Realmente "movement.details" debe contener el UUID o alguna referencia
                                                // Revisaremos si getClientMovements incluye el ticketUuid
                                            } else {
                                                toast.error("El cliente asociado ya no existe.");
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <img
                                                src={`/avatars/${red.clientAvatar || 'default.svg'}`}
                                                alt={red.clientName || ''}
                                                className="w-12 h-12 rounded-full border border-border flex-shrink-0 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/avatars/default.svg";
                                                }}
                                            />
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-foreground truncate">{red.clientName || "Usuario Desconocido"}</h4>
                                                <p className="text-sm text-foreground truncate mt-0.5">Quiere canjear: <span className="font-bold text-primary">{red.rewardName || 'Premio eliminado'}</span></p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground font-medium">
                                                    <span className="font-mono bg-accent text-accent-foreground px-1.5 py-0.5 rounded">{red.ticketUuid.split('-')[0]}...</span>
                                                    <span>•</span>
                                                    <span className="flex items-center"><MessageCircle className="w-3.5 h-3.5 mr-1" /> {red.clientPhone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0 border-t md:border-0 pt-3 md:pt-0 border-border/50">
                                            <div className="text-left md:text-right w-full flex justify-between md:block items-center">
                                                <p className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-full text-xs md:text-sm inline-block md:mb-1">{red.pointsSpent} pts</p>
                                                <p className="text-xs text-muted-foreground flexitems-center"><span className="md:hidden">Solicitado: </span>{new Date(red.createdAt).toLocaleDateString("es-EC")}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 md:flex-none h-9"
                                                    disabled={isProcessingAct === red.id}
                                                    onClick={(e) => { e.stopPropagation(); handleRejectRedemption(red.id); }}
                                                >
                                                    <X className="w-4 h-4 mr-1.5" />
                                                    Rechazar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 md:flex-none h-9"
                                                    disabled={isProcessingAct === red.id}
                                                    onClick={(e) => { e.stopPropagation(); handleApproveRedemption(red.id); }}
                                                >
                                                    <Check className="w-4 h-4 mr-1.5" />
                                                    Aprobar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Directorio de Clientes */}
            <Dialog open={activeModal === 'clients'} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-4xl flex flex-col max-h-[90vh] overflow-hidden p-0">
                    <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Users size={24} className="text-info" />
                            Directorio y Base de Datos de Clientes
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto custom-scrollbar p-6 shrink flex-1 space-y-4">
                        {initialClients.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No hay clientes registrados en el sistema</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Header Tools */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por usuario o número..."
                                            value={clientFilter}
                                            onChange={(e) => setClientFilter(e.target.value)}
                                            className="pl-9 bg-background/50"
                                        />
                                    </div>
                                    <Button variant="outline" onClick={handleExportCSV} className="shrink-0 gap-2">
                                        <Download size={16} />
                                        Exportar CSV
                                    </Button>
                                </div>

                                {clientFilter && (
                                    <p className="text-xs text-muted-foreground font-medium pl-1">{filteredClients.length} de {initialClients.length} resultados</p>
                                )}

                                {/* Table layout */}
                                <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="pl-4 sm:pl-6 w-[200px] sm:w-[400px]">Perfil de Usuario</TableHead>
                                                <TableHead className="text-right pr-4 sm:pr-8">Balance de Puntos</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredClients.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                                                        No se encontraron clientes con esos parámetros
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredClients.map((client) => (
                                                    <TableRow
                                                        key={client.id}
                                                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                                                    >
                                                        <TableCell className="pl-4 sm:pl-6" onClick={() => handleClientClick(client)}>
                                                            <div className="flex items-center gap-4">
                                                                <img
                                                                    src={`/avatars/${client.avatarSvg}`}
                                                                    alt={client.username}
                                                                    className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "/avatars/default.svg";
                                                                    }}
                                                                />
                                                                <div>
                                                                    <span className="font-semibold text-foreground truncate block">
                                                                        {client.username}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground truncate block mt-0.5">
                                                                        {client.phone}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4 sm:pr-8" onClick={() => handleClientClick(client)}>
                                                            <Badge variant="secondary" className="font-bold bg-accent">{client.points} pts</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Client Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle del Cliente</DialogTitle>
                    </DialogHeader>

                    {selectedClient && (
                        <div className="space-y-5">
                            {/* Client Info Header */}
                            <div className="flex items-center gap-4">
                                <img
                                    src={`/avatars/${selectedClient.avatarSvg}`}
                                    alt={selectedClient.username}
                                    className="w-14 h-14 rounded-full border-2 border-border object-cover shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/avatars/default.svg";
                                    }}
                                />
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg text-foreground truncate">
                                        {selectedClient.username}
                                    </h3>
                                    <p className="font-mono text-sm text-muted-foreground">
                                        {selectedClient.phone}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <Badge variant="secondary" className="text-base shrink-0">
                                        {selectedClient.points} pts
                                    </Badge>
                                    {(() => {
                                        const style = getTierStyle(selectedClient.lifetimePoints || 0);
                                        return (
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border shadow-sm ${style.badge}`}>
                                                {style.icon}
                                                <span className="text-[10px] font-black uppercase tracking-widest">{style.name}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <a
                                        href={`https://wa.me/593${selectedClient.phone.slice(1)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                                        WhatsApp
                                    </a>
                                </Button>

                                {selectedClient.isBlocked ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                                        onClick={() => handleUnblock(selectedClient.id)}
                                    >
                                        <Unlock className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                                        Desbloquear
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => setBlockId(selectedClient.id)}
                                    >
                                        <Ban className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                                        Bloquear
                                    </Button>
                                )}

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteId(selectedClient.id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                                    Eliminar
                                </Button>
                            </div>

                            {selectedClient.isBlocked && (
                                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
                                    <p className="font-bold flex items-center gap-2 mb-1"><Ban size={16} /> Cuenta bloqueada</p>
                                    <p>{selectedClient.blockReason}</p>
                                </div>
                            )}

                            {/* New Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Registro</span>
                                    <span className="text-xs font-semibold text-center">{selectedClient.createdAt ? formatEcuadorDate(new Date(selectedClient.createdAt)) : "N/A"}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Cumpleaños</span>
                                    <span className="text-sm font-semibold">{selectedClient.birthDate || "N/A"}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Referidos</span>
                                    <span className="text-sm font-semibold text-primary">{selectedClient.referralCount || 0}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Inicios Sesión</span>
                                    <span className="text-sm font-semibold">{selectedClient.loginCount || 0}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Últ. Acceso</span>
                                    <span className="text-xs font-semibold text-center">{selectedClient.lastLoginAt ? formatEcuadorDate(new Date(selectedClient.lastLoginAt)) : "N/A"}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Códigos Canjeados</span>
                                    <span className="text-sm font-semibold">{selectedClient.codesRedeemed || 0}</span>
                                </div>
                                <div className="bg-muted rounded-lg p-3 justify-center flex flex-col items-center">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Premios Pedidos</span>
                                    <span className="text-sm font-semibold">{selectedClient.totalRedemptions || 0}</span>
                                </div>
                            </div>

                            {/* Movements History */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-muted-foreground">Historial de Movimientos</h4>
                                <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                                    {isLoadingHistory ? (
                                        <p className="text-center text-muted-foreground py-6 animate-pulse text-sm">
                                            Cargando...
                                        </p>
                                    ) : clientMovements.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-6 text-sm">
                                            Sin movimientos registrados.
                                        </p>
                                    ) : (
                                        clientMovements.map((mov) => (
                                            <div
                                                key={mov.id}
                                                className={`flex items-start justify-between gap-2 p-3 bg-card border rounded-lg transition-all ${highlightCode && mov.details?.includes(highlightCode)
                                                    ? "border-primary ring-2 ring-primary/30 animate-pulse"
                                                    : "border-border"
                                                    }`}
                                                ref={(el) => {
                                                    if (el && highlightCode && mov.details?.includes(highlightCode)) {
                                                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                                                        setTimeout(() => setHighlightCode(null), 3000);
                                                    }
                                                }}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-foreground break-words">
                                                        {mov.details}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span>{formatEcuadorDate(new Date(mov.date))}</span>
                                                        {mov.type === "redemption" && mov.status && (
                                                            <Badge
                                                                variant={
                                                                    mov.status === "approved"
                                                                        ? "default"
                                                                        : mov.status === "rejected"
                                                                            ? "destructive"
                                                                            : "outline"
                                                                }
                                                                className="scale-90"
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
                                                        className={`text-sm shrink-0 border-transparent ${mov.points > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
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

            {/* Delete Confirmation */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar cliente?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Esta acción no se puede deshacer. Se eliminará el cliente y todos sus datos asociados.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Block Confirmation */}
            <Dialog open={blockId !== null} onOpenChange={(open) => {
                if (!open) {
                    setBlockId(null);
                    setBlockReason("");
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bloquear Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-muted-foreground mb-4">
                            El cliente no podrá iniciar sesión y será desconectado inmediatamente si tiene una sesión activa abierta. ¿Por qué motivo lo estás bloqueando?
                        </p>
                        <Textarea
                            placeholder="Motivo del bloqueo (ej. Actividad sospechosa, Solicitud del usuario, Fraude...)"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setBlockId(null); setBlockReason(""); }}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleBlock}>Bloquear Cuenta</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Redemption Modal */}
            <Dialog
                open={isOpen('reject-redemption')}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                        setRejectReason("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Canje</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-sm text-muted-foreground mb-4">
                            Por favor, indica el motivo del rechazo. Este mensaje será notificado al cliente mediante el sistema.
                        </p>
                        <Textarea
                            placeholder="Ej: El stock del premio se ha agotado."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button variant="outline" onClick={() => {
                            closeModal();
                            setRejectReason("");
                        }}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmRejectRedemption}>
                            Confirmar Rechazo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
