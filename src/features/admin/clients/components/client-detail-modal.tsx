"use client";

import { useEffect, useState } from "react";
import { getClientMovements, unblockClient } from "@/features/admin/clients/actions/admin-clients";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/lib/modal-store";
import { useRouter } from "next/navigation";
import { MessageCircle, Ban, Unlock, Trash2, Trophy, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const getTierStyle = (lifetimePoints: number) => {
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
    }).replace('.', '').replace('.', '');
};

export function ClientDetailModal() {
    const router = useRouter();
    const { activeModal, data, openModal, closeModal } = useModalStore();

    const [clientMovements, setClientMovements] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [highlightCode, setHighlightCode] = useState<string | null>(null);

    const isModalOpen = activeModal === "client-detail";
    const selectedClient = data?.client as any | undefined;
    const initialHighlightCode = data?.highlightCode as string | undefined;

    useEffect(() => {
        if (isModalOpen && selectedClient) {
            if (initialHighlightCode) {
                setHighlightCode(initialHighlightCode);
            }
            setIsLoadingHistory(true);
            getClientMovements(selectedClient.id).then((movements) => {
                setClientMovements(movements);
                setIsLoadingHistory(false);
            }).catch(() => {
                toast.error("Error al cargar movimientos");
                setIsLoadingHistory(false);
            });
        }
        if (!isModalOpen) {
            setClientMovements([]);
            setHighlightCode(null);
        }
    }, [isModalOpen, selectedClient, initialHighlightCode]);

    const handleUnblock = async (id: number) => {
        try {
            await unblockClient(id);
            toast.success("Cuenta desbloqueada exitosamente");
            if (data?.onStatusChange) {
                (data.onStatusChange as () => void)();
            }
            router.refresh();
        } catch {
            toast.error("Error al desbloquear");
        }
    };

    if (!selectedClient) return null;

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalle del Cliente</DialogTitle>
                </DialogHeader>

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
                                <MessageCircle size={16} className="mr-1.5 hidden sm:inline-block" />
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
                                <Unlock size={16} className="mr-1.5 hidden sm:inline-block" />
                                Desbloquear
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                    openModal("block-client", {
                                        clientId: selectedClient.id,
                                        onSuccess: () => {
                                            if (data?.onStatusChange) (data.onStatusChange as () => void)();
                                        }
                                    });
                                }}
                            >
                                <Ban size={16} className="mr-1.5 hidden sm:inline-block" />
                                Bloquear
                            </Button>
                        )}

                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                openModal("delete-client", {
                                    clientId: selectedClient.id,
                                    onSuccess: () => {
                                        closeModal(); // Also close this modal if deleted
                                    }
                                });
                            }}
                        >
                            <Trash2 size={16} className="mr-1.5 hidden sm:inline-block" />
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
                                                className={`text-sm shrink-0 border-transparent ${mov.points >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
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
            </DialogContent>
        </Dialog>
    );
}
