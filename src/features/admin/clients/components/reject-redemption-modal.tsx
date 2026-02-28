"use client";

import { useState } from "react";
import { rejectRedemption } from "@/actions/admin";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/lib/modal-store";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export function RejectRedemptionModal() {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const isModalOpen = activeModal === "reject-redemption";

    const confirmRejectRedemption = async () => {
        const id = data.redemptionId as number;
        if (!id) return;

        setIsProcessing(true);
        try {
            await rejectRedemption(id, rejectReason || undefined);
            toast.success("Canje rechazado y puntos devueltos al cliente");

            // Invoke callback to update local state if provided
            if (data.onSuccess) {
                (data.onSuccess as (id: number) => void)(id);
            }

            closeModal();
            router.refresh();
        } catch {
            toast.error("Error al rechazar canje");
        } finally {
            setIsProcessing(false);
            setRejectReason("");
        }
    };

    return (
        <Dialog
            open={isModalOpen}
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
                    }} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={confirmRejectRedemption} disabled={isProcessing}>
                        {isProcessing ? "Rechazando..." : "Confirmar Rechazo"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
