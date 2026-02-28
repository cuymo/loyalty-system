"use client";

import { useState } from "react";
import { useModalStore } from "@/lib/modal-store";
import { deleteReward } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function RewardDeleteAlert() {
    const router = useRouter();
    const { isOpen, closeModal, data } = useModalStore();
    const isShowing = isOpen("reward_delete_alert");
    const rewardId = data?.rewardId as number | undefined;

    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!rewardId) return;
        setIsLoading(true);
        try {
            const result = await deleteReward(rewardId);
            if (result && !result.success) {
                toast.error(result.error || "No se pudo eliminar el premio.");
            } else {
                toast.success("Premio eliminado permanentemente");
                closeModal();
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isShowing} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-destructive">¿Eliminar premio?</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Esta acción no se puede deshacer. Se eliminará permanentemente el premio seleccionado de la base de datos.
                        Solo procede si estás 100% seguro y si nadie ha canjeado este premio aún.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={closeModal} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
