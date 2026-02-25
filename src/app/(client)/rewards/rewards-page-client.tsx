/**
 * (client)/rewards/rewards-page-client.tsx
 * Descripcion: Contenedor con Tabs para alternar entre Premios y Canjeados
 * Fecha de creacion: 2026-02-23
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion: Drawer de detalle de ticket con UUID copiable y mensaje WhatsApp
 */

"use client";

import { useState } from "react";
import { Gift, History, Ticket, Copy, MessageCircle, Clock } from "lucide-react";
import type { Reward } from "@/types";
import { RewardsClientView } from "./rewards-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";

interface RedemptionItem {
    id: number;
    rewardId: number;
    ticketUuid: string;
    pointsSpent: number;
    status: "pending" | "approved" | "rejected";
    createdAt: Date;
    rewardName: string | null;
    rewardImageUrl: string | null;
    rewardType: "discount" | "product" | null;
}

interface RewardsPageClientProps {
    rewards: Reward[];
    clientPoints: number;
    clientVip?: { currentTier: string };
    wantsMarketing: boolean;
    wantsTransactional: boolean;
    redemptions: RedemptionItem[];
}

export function RewardsPageClient({ rewards, clientPoints, clientVip, wantsMarketing, wantsTransactional, redemptions }: RewardsPageClientProps) {
    const [selectedRedemption, setSelectedRedemption] = useState<RedemptionItem | null>(null);

    return (
        <>
            <Tabs defaultValue="rewards" className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="rewards" className="flex-1 gap-1.5">
                        <Gift size={14} />
                        Premios
                    </TabsTrigger>
                    <TabsTrigger value="redeemed" className="flex-1 gap-1.5">
                        <History size={14} />
                        Canjeados
                        {redemptions.length > 0 && (
                            <span className="ml-1 bg-muted-foreground/20 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {redemptions.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rewards" className="mt-4">
                    <RewardsClientView rewards={rewards} clientPoints={clientPoints} clientVip={clientVip} wantsMarketing={wantsMarketing} wantsTransactional={wantsTransactional} />
                </TabsContent>

                <TabsContent value="redeemed" className="mt-4">
                    {redemptions.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground animate-in fade-in duration-500">
                            <Ticket size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No has canjeado premios aún</p>
                            <p className="text-sm mt-1">Tus canjes aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-700">
                            {redemptions.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedRedemption(r)}
                                    className="w-full text-left bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-border/80 active:scale-[0.98]"
                                >
                                    <div className="flex gap-3 p-3">
                                        {/* Imagen del premio */}
                                        <div className="w-20 h-20 rounded-xl bg-accent/30 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                                            {r.rewardImageUrl ? (
                                                <img
                                                    src={r.rewardImageUrl}
                                                    alt={r.rewardName || "Premio"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Gift size={24} className="text-muted-foreground opacity-40" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div>
                                                <p className="text-foreground text-sm font-semibold tracking-tight truncate">
                                                    {r.rewardName || "Premio eliminado"}
                                                </p>
                                                <p className="text-muted-foreground text-xs mt-0.5">
                                                    {r.pointsSpent} pts •{" "}
                                                    {r.createdAt
                                                        ? new Date(r.createdAt).toLocaleDateString("es-EC", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })
                                                        : "-"}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.status === "approved"
                                                        ? "bg-success/10 text-success"
                                                        : r.status === "rejected"
                                                            ? "bg-destructive/10 text-destructive"
                                                            : "bg-warning/10 text-warning"
                                                        }`}
                                                >
                                                    {r.status === "approved"
                                                        ? "Aprobado"
                                                        : r.status === "rejected"
                                                            ? "Rechazado"
                                                            : "Pendiente"}
                                                </span>
                                                {r.rewardType && (
                                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                        {r.rewardType === "discount" ? "Descuento" : "Producto"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Drawer de Detalle de Ticket */}
            <Drawer open={!!selectedRedemption} onOpenChange={(open) => !open && setSelectedRedemption(null)}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle className="text-xl text-center">Detalle del Canje</DrawerTitle>
                    </DrawerHeader>
                    {selectedRedemption && (
                        <div className="px-4 pb-2 space-y-4 overflow-y-auto">
                            {/* Reward info */}
                            <div className="flex gap-3 items-center">
                                <div className="w-16 h-16 rounded-xl bg-accent/30 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                                    {selectedRedemption.rewardImageUrl ? (
                                        <img
                                            src={selectedRedemption.rewardImageUrl}
                                            alt={selectedRedemption.rewardName || "Premio"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Gift size={24} className="text-muted-foreground opacity-40" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-foreground font-semibold truncate">
                                        {selectedRedemption.rewardName || "Premio eliminado"}
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        {selectedRedemption.pointsSpent} pts •{" "}
                                        {new Date(selectedRedemption.createdAt).toLocaleDateString("es-EC", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${selectedRedemption.status === "approved"
                                        ? "bg-success/10 text-success"
                                        : selectedRedemption.status === "rejected"
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-warning/10 text-warning"
                                        }`}
                                >
                                    {selectedRedemption.status === "approved"
                                        ? "Aprobado"
                                        : selectedRedemption.status === "rejected"
                                            ? "Rechazado"
                                            : "Pendiente"}
                                </span>
                            </div>

                            {/* Ticket UUID copiable */}
                            <div className="p-4 bg-accent text-accent-foreground rounded-xl space-y-2">
                                <p className="text-muted-foreground text-xs">Ticket de Canje</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-foreground font-mono text-sm break-all flex-1">
                                        {selectedRedemption.ticketUuid}
                                    </p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedRedemption.ticketUuid);
                                            toast.success("Ticket copiado");
                                        }}
                                        className="p-2 rounded-lg hover:bg-background/50 transition-colors shrink-0 border border-border"
                                    >
                                        <Copy size={16} className="text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Mensaje según estado y wantsTransactional */}
                            {selectedRedemption.status === "pending" && (
                                <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle size={16} className="text-warning shrink-0" />
                                        <p className="text-sm font-medium text-foreground">Esperando confirmación</p>
                                    </div>
                                    {wantsTransactional ? (
                                        <>
                                            <p className="text-muted-foreground text-xs leading-relaxed">
                                                Tu canje está siendo revisado. Un empleado te contactará por WhatsApp para coordinar la entrega de tu premio.
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <Clock size={12} className="text-muted-foreground" />
                                                <p className="text-muted-foreground text-[11px]">
                                                    Respondemos en horario laborable
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Tu canje está siendo revisado. Recuerda que debido a tus opciones de privacidad, no te contactaremos por WhatsApp. Por favor, escríbenos a nuestro WhatsApp con este ticket.
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedRedemption.status === "approved" && (
                                <div className="p-4 bg-success/5 border border-success/20 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle size={16} className="text-success shrink-0" />
                                        <p className="text-sm font-medium text-foreground">¡Canje aprobado!</p>
                                    </div>
                                    {wantsTransactional ? (
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Tu premio ha sido aprobado. Si aún no te han contactado, te escribiremos por WhatsApp pronto para coordinar la entrega.
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Tu premio ha sido aprobado. Por favor, escríbenos a nuestro WhatsApp con este ticket para coordinar la entrega.
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedRedemption.status === "rejected" && (
                                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MessageCircle size={16} className="text-destructive shrink-0" />
                                        <p className="text-sm font-medium text-foreground">Canje rechazado</p>
                                    </div>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Este canje fue rechazado y tus puntos fueron devueltos. Si tienes dudas, contáctanos por WhatsApp para ayudarte.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full py-6 rounded-xl">Cerrar</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}

