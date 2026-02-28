"use client";

import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { createClientGroup, deleteClientGroup } from "@/features/admin/campaigns/actions/admin-campaigns";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface GroupsModalProps {
    initialGroups: any[];
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
}

export function GroupsModal({ initialGroups, activeFilter, setActiveFilter }: GroupsModalProps) {
    const router = useRouter();
    const { activeModal, closeModal } = useModalStore();
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const isOpen = activeModal === "manage_groups";

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsCreatingGroup(true);
        try {
            await createClientGroup(newGroupName);
            setNewGroupName("");
            toast.success("Grupo creado exitosamente");
            router.refresh();
        } catch {
            toast.error("Error al crear grupo");
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (id: number) => {
        try {
            await deleteClientGroup(id);
            if (activeFilter === `group_${id}`) {
                setActiveFilter('all');
            }
            toast.success("Grupo eliminado");
            router.refresh();
        } catch {
            toast.error("Error al eliminar grupo");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Grupos de Clientes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nombre del nuevo grupo..."
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            disabled={isCreatingGroup}
                        />
                        <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !newGroupName.trim()}>
                            <Plus size={16} className="mr-2" />
                            Añadir
                        </Button>
                    </div>
                    <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto">
                        {initialGroups.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">No has creado ningún grupo todavía.</p>
                        ) : (
                            initialGroups.map(group => (
                                <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                    <div>
                                        <h4 className="font-medium">{group.name}</h4>
                                        <p className="text-xs text-muted-foreground">Id: {group.id}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteGroup(group.id)}>
                                        <Trash size={16} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
