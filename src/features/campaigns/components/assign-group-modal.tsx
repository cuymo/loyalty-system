"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { assignClientsToGroup } from "@/features/campaigns/actions/admin-campaigns";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface AssignGroupModalProps {
    initialGroups: any[];
    onSuccess?: () => void;
}

export function AssignGroupModal({ initialGroups, onSuccess }: AssignGroupModalProps) {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [assignTargetGroup, setAssignTargetGroup] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);

    const isOpen = activeModal === "assign_group";
    const selectedIds = (data?.selectedIds as number[]) || [];

    const handleAssignToGroup = async () => {
        if (!assignTargetGroup) return;
        setIsAssigning(true);
        try {
            await assignClientsToGroup(Number(assignTargetGroup), selectedIds);
            toast.success("Clientes asignados al grupo");
            setAssignTargetGroup("");
            closeModal();
            if (onSuccess) onSuccess();
            router.refresh();
        } catch {
            toast.error("Error al asignar clientes");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                closeModal();
                setAssignTargetGroup("");
            }
        }}>
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
                        <Button variant="outline" onClick={() => {
                            closeModal();
                            setAssignTargetGroup("");
                        }} disabled={isAssigning}>Cancelar</Button>
                        <Button onClick={handleAssignToGroup} disabled={!assignTargetGroup || isAssigning}>
                            {isAssigning ? "Asignando..." : "Confirmar Asignación"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
