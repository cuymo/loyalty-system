"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useModalStore } from "@/lib/modal-store";
import { MessageCircle, ShieldAlert } from "lucide-react";
import { removeClientsFromGroup } from "@/features/admin/campaigns/actions/admin-campaigns";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

interface ClientDetailDrawerProps {
    isLoadingHistory: boolean;
    clientMovements: any[];
}

export function ClientDetailDrawer({ isLoadingHistory, clientMovements }: ClientDetailDrawerProps) {
    const isMobile = useIsMobile();
    const { activeModal, data, closeModal } = useModalStore();

    const isOpen = activeModal === "client_campaign_detail";
    const selectedDetailClient = data?.client as any;
    const activeFilter = (data?.activeFilter as string) || "all";

    const content = selectedDetailClient ? (
        <div className="space-y-6 px-4 pb-6 sm:px-0 sm:pb-0">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <img
                    src={`/avatars/${selectedDetailClient.avatarSvg}`}
                    alt={selectedDetailClient.username}
                    className="w-16 h-16 rounded-full border-2 border-border object-cover shrink-0 bg-background"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/avatars/default.svg";
                    }}
                />
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl text-foreground truncate flex items-center gap-2">
                        {selectedDetailClient.username}
                        {!selectedDetailClient.wantsMarketing && (
                            <span title="No desea recibir marketing">
                                <ShieldAlert size={16} className="text-warning" />
                            </span>
                        )}
                    </h3>
                    <p className="font-mono text-sm text-muted-foreground mt-0.5">
                        {selectedDetailClient.phone}
                    </p>
                </div>
                <div className="text-right">
                    <Badge variant="default" className="text-lg px-4 py-1 bg-primary/10 text-primary border-primary/20">
                        {selectedDetailClient.points} pts
                    </Badge>
                </div>
            </div>
            <div className="flex gap-2">
                <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white" asChild>
                    <a
                        href={`https://wa.me/593${selectedDetailClient.phone.slice(1)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contactar por WhatsApp
                    </a>
                </Button>
                {activeFilter.startsWith('group_') && (
                    <Button variant="destructive" onClick={async () => {
                        const gid = Number(activeFilter.replace('group_', ''));
                        await removeClientsFromGroup(gid, [selectedDetailClient.id]);
                        toast.success("Removido del grupo");
                        closeModal();
                    }}>
                        Remover de Grupo
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-background border rounded-lg p-3 justify-center flex flex-col items-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 text-center">Registro</span>
                    <span className="text-sm font-medium">{selectedDetailClient.createdAt ? new Date(selectedDetailClient.createdAt).toLocaleDateString("es-EC") : "N/A"}</span>
                </div>
            </div>
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">Historial Reciente</h4>
                <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-2">
                    {isLoadingHistory ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : clientMovements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin movimientos.</p>
                    ) : (
                        clientMovements.map((mov) => (
                            <div key={mov.id} className="flex justify-between p-3 border rounded-lg">
                                <div className="text-sm">{mov.details}</div>
                                <Badge variant="outline">{mov.points} pts</Badge>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    ) : null;

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle>Perfil del Cliente</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto max-h-[75vh]">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Perfil del Cliente</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}
