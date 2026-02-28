"use client";

import { useState } from "react";
import { blockClient } from "@/features/admin/clients/actions/admin-clients";
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

export function BlockClientAlert() {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [blockReason, setBlockReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const isModalOpen = activeModal === "block-client";

    const handleBlock = async () => {
        const id = data.clientId as number;
        if (!id) return;

        if (!blockReason.trim()) {
            toast.error("Debes ingresar un motivo para bloquear la cuenta.");
            return;
        }

        setIsProcessing(true);
        try {
            await blockClient(id, blockReason.trim());
            toast.success("Cuenta bloqueada exitosamente");
            if (data.onSuccess) {
                (data.onSuccess as () => void)();
            }
            closeModal();
            router.refresh();
        } catch {
            toast.error("Error al bloquear cliente");
        } finally {
            setIsProcessing(false);
            setBlockReason("");
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
                closeModal();
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
                    <Button variant="outline" onClick={() => { closeModal(); setBlockReason(""); }} disabled={isProcessing}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleBlock} disabled={isProcessing}>
                        {isProcessing ? "Bloqueando..." : "Bloquear Cuenta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
