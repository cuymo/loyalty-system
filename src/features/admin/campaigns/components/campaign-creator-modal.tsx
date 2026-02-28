"use client";

import { useState } from "react";
import { MessageCircle, Gift } from "lucide-react";
import { toast } from "@/lib/toast";
import { processCrmCampaign } from "@/features/admin/campaigns/actions/admin-campaigns";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export function CampaignCreatorModal() {
    const { activeModal, data, closeModal } = useModalStore();
    const isOpen = activeModal === "campaign_creator";

    const selectedClients = (data?.selectedClients as any[]) || [];
    const selectedIds = (data?.selectedIds as number[]) || [];

    const [isProcessing, setIsProcessing] = useState(false);
    const [enablePoints, setEnablePoints] = useState(false);
    const [giftPoints, setGiftPoints] = useState<number>(0);
    const hasAnyNoMarketing = selectedClients.some((c: any) => !c.wantsMarketing);
    const [enableMessage, setEnableMessage] = useState(!hasAnyNoMarketing);
    const [msgTitle, setMsgTitle] = useState("");
    const [msgBody, setMsgBody] = useState("");
    const [msgImageUrl, setMsgImageUrl] = useState("");

    const handleLaunchCampaign = async () => {
        if (!msgTitle.trim() || !msgBody.trim()) {
            toast.error("El Título y Descripción son obligatorios.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await processCrmCampaign(selectedIds, {
                pointsToGift: enablePoints ? giftPoints : 0,
                sendMessage: enableMessage,
                title: msgTitle.trim(),
                body: msgBody.trim(),
                imageUrl: msgImageUrl || undefined
            });

            if (res.success) {
                toast.success("Campaña ejecutada exitosamente");
                window.dispatchEvent(new Event("campaign_done"));
                handleClose();
            } else {
                toast.error(res.error || "Error crítico al enviar campaña");
            }
        } catch {
            toast.error("Fallo comunicación");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        closeModal();
        setMsgTitle("");
        setMsgBody("");
        setMsgImageUrl("");
        setEnablePoints(false);
        setGiftPoints(0);
        setEnableMessage(!hasAnyNoMarketing);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Asistente de Campaña ({selectedIds.length} clientes)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título (Obligatorio)</label>
                        <Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Ej. ¡Feliz Aniversario!" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mensaje (Obligatorio)</label>
                        <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Ej. Tienes un regalo especial esperándote. Muéstranos este mensaje." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">URL de Imagen (Opcional para WhatsApp)</label>
                        <Input value={msgImageUrl} onChange={e => setMsgImageUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className={`p-3 bg-muted/50 rounded-lg border ${hasAnyNoMarketing ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm flex items-center gap-2 font-semibold"><MessageCircle size={16} className="text-[#25D366]" />Enviar por WhatsApp</span>
                                <Checkbox checked={enableMessage} onCheckedChange={(checked) => setEnableMessage(checked === true)} disabled={hasAnyNoMarketing} />
                            </div>
                            {hasAnyNoMarketing && (
                                <p className="text-[12px] text-destructive font-bold mt-1">
                                    Deshabilitado: Al menos un cliente destino no permite envíos de marketing de WhatsApp.
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm flex items-center gap-2 font-semibold"><Gift size={16} className="text-primary" />Acreditar Puntos</span>
                                <Checkbox checked={enablePoints} onCheckedChange={(checked) => setEnablePoints(checked === true)} />
                            </div>
                            {enablePoints && (
                                <Input type="number" value={giftPoints || ''} onChange={(e) => setGiftPoints(Number(e.target.value))} placeholder="Cantidad de puntos" />
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="mt-2 text-right">
                    <Button variant="outline" onClick={handleClose} disabled={isProcessing}>Cancelar</Button>
                    <Button onClick={handleLaunchCampaign} disabled={isProcessing}>
                        {isProcessing ? "Enviando..." : "Enviar Ahora"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
