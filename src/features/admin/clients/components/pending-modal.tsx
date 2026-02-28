"use client";

import { approveRedemption } from "@/features/admin/redemptions/actions/admin-redemptions";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/lib/modal-store";
import { useRouter } from "next/navigation";
import { Gift, Check, X, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PendingModalProps {
    pendingRedemptions: any[];
    initialClients: any[];
    onApproveAction: (id: number) => void;
    onRejectAction: (id: number) => void;
    isProcessingAct: number | null;
}

export function PendingModal({ pendingRedemptions, initialClients, onApproveAction, onRejectAction, isProcessingAct }: PendingModalProps) {
    const router = useRouter();
    const { activeModal, openModal, closeModal } = useModalStore();

    const isModalOpen = activeModal === "pending";

    const handleApproveRedemption = async (id: number) => {
        try {
            await approveRedemption(id);
            toast.success("Canje aprobado exitosamente");
            onApproveAction(id);
            router.refresh();
        } catch {
            toast.error("Error al aprobar canje");
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-3xl flex flex-col max-h-[85vh] overflow-hidden p-0">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Gift size={20} className="text-primary" />
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
                            const existingClient = initialClients.find(c => c.id === red.clientId);

                            return (
                                <div
                                    key={red.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-card border border-border rounded-xl gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                    onClick={() => {
                                        if (existingClient) {
                                            const ticketShort = red.ticketUuid.split('-')[0];
                                            openModal("client-detail", {
                                                client: existingClient,
                                                highlightCode: ticketShort
                                            });
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
                                            <p className="text-xs text-muted-foreground flex items-center"><span className="md:hidden">Solicitado: </span>{new Date(red.createdAt).toLocaleDateString("es-EC")}</p>
                                        </div>
                                        <div className="flex items-center gap-2 w-full">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 md:flex-none h-9"
                                                disabled={isProcessingAct === red.id}
                                                onClick={(e) => { e.stopPropagation(); onRejectAction(red.id); }}
                                            >
                                                <X size={16} className="mr-1.5" />
                                                Rechazar
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1 md:flex-none h-9"
                                                disabled={isProcessingAct === red.id}
                                                onClick={(e) => { e.stopPropagation(); handleApproveRedemption(red.id); }}
                                            >
                                                <Check size={16} className="mr-1.5" />
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
    );
}
