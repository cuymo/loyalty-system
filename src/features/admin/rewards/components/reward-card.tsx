"use client";

import { useModalStore } from "@/lib/modal-store";
import type { Reward } from "@/types";
import { Gift, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

interface RewardCardProps {
    reward: Reward;
}

export function RewardCard({ reward }: RewardCardProps) {
    const { openModal } = useModalStore();

    const imageUrl = reward.imageUrl && reward.imageUrl.length > 0 ? reward.imageUrl[0] : null;

    return (
        <Card className="overflow-hidden flex flex-col group relative">
            {/* Actions Overlay */}
            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => openModal("reward_modal", { reward })}
                    title="Editar"
                >
                    <Pencil size={14} />
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 shadow-sm"
                    onClick={() => openModal("reward_delete_alert", { rewardId: reward.id })}
                    title="Eliminar"
                >
                    <Trash2 size={14} />
                </Button>
            </div>

            {/* Image Container */}
            <div className="relative w-full pb-[56%] md:pb-[75%] bg-card border-b border-border">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={reward.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ width: "100%", height: "100%" }}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                        <Gift size={48} className="mb-2" />
                        <span className="text-sm font-medium">Sin Imagen</span>
                    </div>
                )}

                <Badge
                    className="absolute bottom-3 right-3 shadow-md border-border bg-card/10 backdrop-blur-md text-foreground hover:bg-card/20"
                >
                    {reward.pointsRequired} pts
                </Badge>
                <Badge
                    className="absolute bottom-3 left-3 shadow-md text-xs font-semibold"
                    variant={reward.type === "discount" ? "secondary" : "default"}
                >
                    {reward.type === "discount" ? "Descuento" : reward.type === "credit" ? "Crédito" : "Producto"}
                </Badge>

                {reward.stock !== null && (
                    <Badge
                        className="absolute top-3 left-3 shadow-md text-xs font-semibold bg-accent text-accent-foreground"
                    >
                        Stock: {reward.stock}
                    </Badge>
                )}

                {(reward.status === "inactive" || reward.status === "out_of_stock") && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[1px]">
                        <Badge variant="destructive" className="font-bold text-sm tracking-wider">
                            {reward.status === "inactive" ? "INACTIVO" : "AGOTADO"}
                        </Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-4 flex-1">
                <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                    {reward.name}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">
                    {reward.description || "Sin descripción"}
                </p>
                {reward.requiredTier && reward.requiredTier !== "none" && (
                    <p className="text-xs text-muted-foreground font-semibold mt-2 uppercase">
                        Solo para Nivel: <span className="text-primary">{reward.requiredTier}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
