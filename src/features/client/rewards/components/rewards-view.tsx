/**
 * (client)/rewards/rewards-view.tsx
 * Descripcion: Vista interactiva del catalogo de premios con modal de canje
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { requestRedemption } from "@/features/client/rewards/actions/client-rewards";
import { useRouter } from "next/navigation";
import { Gift, Check, X, ShieldAlert, Copy, MessageCircle, Lock } from "lucide-react";
import type { Reward } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";

interface RewardsClientViewProps {
    rewards: Reward[];
    clientPoints: number;
    clientVip?: { currentTier: string };
    wantsMarketing: boolean;
    wantsTransactional: boolean;
}

const tierRank = { "none": 0, "bronze": 1, "silver": 2, "gold": 3, "vip": 4 };
const tierNames = { "none": "Ninguno", "bronze": "Bronce", "silver": "Plata", "gold": "Oro", "vip": "VIP" };

export function RewardsClientView({
    rewards,
    clientPoints,
    clientVip,
    wantsMarketing,
    wantsTransactional,
}: RewardsClientViewProps) {
    const router = useRouter();
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        ticketUuid?: string;
        error?: string;
    } | null>(null);

    const handleRedeem = async () => {
        if (!selectedReward) return;
        setIsLoading(true);
        try {
            const res = await requestRedemption(selectedReward.id);
            setResult(res);
            if (res.success) {
                toast.success(`¡Canje solicitado con éxito! Ticket generado.`);
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedReward(null);
        setResult(null);
    };

    return (
        <>
            {rewards.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground animate-in fade-in duration-500">
                    <Gift size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay premios disponibles</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-700">
                    {rewards.map((reward) => {
                        const requiredRank = tierRank[reward.requiredTier as keyof typeof tierRank] || 0;
                        const currentRank = tierRank[(clientVip?.currentTier || "none") as keyof typeof tierRank] || 0;
                        const isTierLocked = requiredRank > currentRank;
                        const canAfford = clientPoints >= reward.pointsRequired;

                        return (
                            <button
                                key={reward.id}
                                onClick={() => {
                                    if (isTierLocked) {
                                        toast.error(`Necesitas ser nivel ${tierNames[reward.requiredTier as keyof typeof tierNames]} para canjear este premio.`);
                                        return;
                                    }
                                    setSelectedReward(reward);
                                }}
                                className={`group relative w-full text-left rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${canAfford && !isTierLocked
                                    ? "bg-card border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-1"
                                    : "bg-background border-border/50 hover:border-border/80"
                                    } ${isTierLocked ? "opacity-75 grayscale-[0.5]" : ""}`}
                            >
                                {/* Image Container 4:5 Aspect Ratio */}
                                <div className="relative w-full pb-[125%] bg-accent/30 border-b border-border/40 overflow-hidden">
                                    {reward.imageUrl && reward.imageUrl.length > 0 ? (
                                        <img
                                            src={reward.imageUrl[0]}
                                            alt={reward.name}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            style={{ width: "100%", height: "100%" }}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-30 bg-muted/20">
                                            <Gift size={48} className="mb-2" />
                                            <span className="text-sm font-medium">Sin Imagen</span>
                                        </div>
                                    )}

                                    {isTierLocked && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                                            <div className="bg-background/60 text-foreground p-1.5 rounded-md mb-1.5 shadow-sm border border-border/50">
                                                <Lock size={16} />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-background/90 text-foreground px-2.5 py-1 rounded shadow-md border border-border/80">
                                                Nivel {tierNames[reward.requiredTier as keyof typeof tierNames]}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border/50 shadow-sm z-20">
                                        <p className={`text-xs font-bold tracking-tight ${canAfford && !isTierLocked ? "text-foreground" : "text-muted-foreground"}`}>
                                            {reward.pointsRequired} pts
                                        </p>
                                    </div>
                                    <div
                                        className={`absolute bottom-3 left-3 px-2.5 py-1 rounded shadow-sm text-[9px] font-black uppercase tracking-wider z-20 ${reward.type === "discount"
                                            ? "bg-info text-info-foreground backdrop-blur-md"
                                            : "bg-primary text-primary-foreground backdrop-blur-md"
                                            }`}
                                    >
                                        {reward.type === "discount" ? "Desc." : "Prod."}
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col items-start justify-start">
                                    <h3 className="font-semibold text-sm text-foreground mb-1.5 line-clamp-1 w-full text-left tracking-tight">
                                        {reward.name}
                                    </h3>
                                    <p className="text-muted-foreground text-xs w-full text-left line-clamp-2 min-h-[32px] leading-relaxed">
                                        {reward.description || "Sin descripción"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Drawer de Canje (Mobile-first) */}
            <Drawer open={!!selectedReward} onOpenChange={(open) => !open && closeModal()}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-xl text-center">Confirmar Canje</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-2 space-y-5 overflow-y-auto">
                        {selectedReward && !result ? (
                            <>
                                {selectedReward.imageUrl && selectedReward.imageUrl.length > 0 && (
                                    <div className="w-full h-48 sm:h-56 relative rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-accent/30 flex items-center justify-center p-2">
                                        <img
                                            src={selectedReward.imageUrl[0]}
                                            alt={selectedReward.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                <div className="p-4 bg-accent text-accent-foreground rounded-xl space-y-2">
                                    <p className="text-foreground font-medium">{selectedReward.name}</p>
                                    <p className="text-muted-foreground text-sm">{selectedReward.description}</p>
                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span className="text-muted-foreground text-sm">Costo</span>
                                        <span className="text-foreground font-bold">{selectedReward.pointsRequired} pts</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Puntos restantes</span>
                                        <span className="text-muted-foreground font-medium">
                                            {clientPoints - selectedReward.pointsRequired} pts
                                        </span>
                                    </div>
                                </div>
                                <div className="text-center pb-2">
                                    <p className="text-sm font-semibold text-foreground">¿Estás seguro de confirmar este canje?</p>
                                </div>
                            </>
                        ) : result?.success ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                                    <Check size={32} className="text-success" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">¡Canje Solicitado!</h2>

                                {/* Ticket copiable */}
                                <div className="p-4 bg-accent text-accent-foreground rounded-xl space-y-2">
                                    <p className="text-muted-foreground text-xs">Tu Ticket de Canje</p>
                                    <div className="flex items-center gap-2 justify-center">
                                        <p className="text-foreground font-mono text-sm break-all">{result.ticketUuid}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(result.ticketUuid || "");
                                                toast.success("Ticket copiado");
                                            }}
                                            className="p-1.5 rounded-md hover:bg-background/50 transition-colors shrink-0"
                                        >
                                            <Copy size={14} className="text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mensaje WhatsApp / Presencial */}
                                {wantsTransactional ? (
                                    <div className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={16} className="text-success shrink-0" />
                                            <p className="text-sm font-medium text-foreground">Te contactaremos por WhatsApp</p>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Un empleado se comunicará contigo para coordinar la entrega de tu premio. Respondemos en horario laborable.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl space-y-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle size={16} className="text-warning shrink-0" />
                                            <p className="text-sm font-medium text-foreground">Comunícate con nosotros</p>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Vemos que tienes desactivados los mensajes de WhatsApp. Para coordinar la entrega de tu premio, por favor escríbenos con tu ticket.
                                        </p>
                                    </div>
                                )}

                                <p className="text-muted-foreground text-xs">
                                    Guarda tu ticket. Lo puedes encontrar en la pestaña &quot;Canjeados&quot;.
                                </p>
                            </div>
                        ) : result ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                                    <X size={32} className="text-destructive" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Error en el Canje</h2>
                                <p className="text-destructive text-sm">{result.error}</p>
                            </div>
                        ) : null}
                    </div>
                    <DrawerFooter>
                        {!result ? (
                            <div className="flex gap-3 w-full">
                                <DrawerClose asChild>
                                    <Button variant="outline" className="flex-1 py-6 rounded-xl text-muted-foreground">
                                        Cancelar
                                    </Button>
                                </DrawerClose>
                                <Button
                                    onClick={handleRedeem}
                                    disabled={isLoading || (selectedReward ? clientPoints < selectedReward.pointsRequired : true)}
                                    className="flex-1 py-6 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {isLoading
                                        ? "Canjeando..."
                                        : selectedReward && clientPoints < selectedReward.pointsRequired
                                            ? <><ShieldAlert size={16} /> Puntos insuficientes</>
                                            : "Confirmar"}
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={closeModal} className="w-full py-6 rounded-xl">Aceptar</Button>
                        )}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
