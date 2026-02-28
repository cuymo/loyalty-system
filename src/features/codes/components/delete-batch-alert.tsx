"use client";

import { useState } from "react";
import { deleteBatch } from "@/actions/admin";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export function DeleteBatchAlert() {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [deleteLoading, setDeleteLoading] = useState(false);

    const isModalOpen = activeModal === "deleteBatchAlert";
    const batchName = data?.batchName as string | undefined;
    const isExhausted = data?.isExhausted as boolean | undefined;

    const handleDeleteBatch = async () => {
        if (!batchName) return;
        setDeleteLoading(true);
        try {
            const count = await deleteBatch(batchName);
            if (isExhausted) {
                toast.success(`El lote ${batchName} ha sido archivado/ocultado exitosamente.`);
            } else {
                toast.success(`${count} códigos no utilizados eliminados permanentemente.`);
            }
            closeModal();
            router.refresh();
        } catch {
            toast.error("Error al eliminar el lote");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar Lote</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 text-sm text-muted-foreground">
                    {isExhausted ? (
                        <>
                            <p>
                                El lote <strong className="text-foreground">{batchName}</strong> está <strong>agotado</strong>.
                            </p>
                            <p>
                                Al eliminarlo, se ocultará permanentemente de esta lista para mantener el orden. El historial de canjes de los clientes no se verá afectado.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                ¿Estás seguro que deseas eliminar el lote <strong className="text-foreground">{batchName}</strong>?
                            </p>
                            <p>
                                Solo se eliminarán los códigos <strong>no utilizados</strong>. Los códigos que ya han sido canjeados por los clientes se mantendrán para preservar el historial.
                            </p>
                        </>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => closeModal()}
                        disabled={deleteLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteBatch}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
