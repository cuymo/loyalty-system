"use client";

import { Check, X, MessageCircle, Gift } from "lucide-react";
import { useModalStore } from "@/lib/modal-store";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PendingTabProps {
    pendingRedemptions: any[];
    initialClients: any[];
    isProcessingAct: number | null;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export function PendingTab({ pendingRedemptions, initialClients, isProcessingAct, onApprove, onReject }: PendingTabProps) {
    if (pendingRedemptions.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-20">
                    <div className="p-4 bg-success/10 rounded-full mb-4">
                        <Check size={32} className="text-success" />
                    </div>
                    <h4 className="text-lg font-semibold">¡Todo al día!</h4>
                    <p className="text-muted-foreground text-center max-w-xs mt-2">
                        No tienes solicitudes de canje pendientes en este momento.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingRedemptions.map((red) => {
                const client = initialClients.find(c => c.id === red.clientId);
                return (
                    <Card key={red.id} className="border-border/50 shadow-sm transition-shadow group">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-14 w-14 border border-border shadow-sm">
                                            <AvatarImage src={`/avatars/${red.clientAvatar}`} />
                                            <AvatarFallback>{red.clientName?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-background">
                                            <Gift size={10} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-lg leading-tight tracking-tight">{red.clientName}</h4>
                                        <p className="text-sm font-medium text-primary mt-1 flex items-center gap-1.5">
                                            Canje por: <span className="underline underline-offset-4">{red.rewardName}</span>
                                        </p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <Badge variant="secondary" className="font-mono text-[10px] px-2 border-none">
                                                #{red.ticketUuid.split('-')[0].toUpperCase()}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground flex items-center uppercase tracking-wider font-bold">
                                                <MessageCircle size={12} className="mr-1" />
                                                {red.clientPhone}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-foreground">-{red.pointsSpent.toLocaleString()}</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">Puntos</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <Button
                                    variant="secondary"
                                    className="w-full font-bold"
                                    onClick={() => onReject(red.id)}
                                    disabled={isProcessingAct === red.id}
                                >
                                    <X size={16} className="mr-2" />
                                    Rechazar
                                </Button>
                                <Button
                                    variant="default"
                                    className="w-full font-bold shadow-lg shadow-primary/20"
                                    onClick={() => onApprove(red.id)}
                                    disabled={isProcessingAct === red.id}
                                >
                                    <Check size={16} className="mr-2" />
                                    Aprobar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
