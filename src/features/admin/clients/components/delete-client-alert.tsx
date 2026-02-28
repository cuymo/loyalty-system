"use client";

import { useState } from "react";
import { deleteClient } from "@/features/admin/clients/actions/admin-clients";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/lib/modal-store";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export function DeleteClientAlert() {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [isDeleting, setIsDeleting] = useState(false);

    const isModalOpen = activeModal === "delete-client";

    const handleDelete = async () => {
        const id = data.clientId as number;
        if (!id) return;

        setIsDeleting(true);
        try {
            await deleteClient(id);
            toast.success("Cliente eliminado");
            if (data.onSuccess) {
                (data.onSuccess as () => void)();
            }
            closeModal();
            router.refresh();
        } catch {
            toast.error("Error al eliminar el cliente");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Eliminar cliente?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Esta acción no se puede deshacer. Se eliminará el cliente y todos sus datos asociados.
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => closeModal()} disabled={isDeleting}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
