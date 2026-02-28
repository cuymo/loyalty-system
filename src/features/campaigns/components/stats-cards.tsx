"use client";

import { useMemo } from "react";
import { Megaphone, Users, Gift, TrendingUp, MessageCircle } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";

interface CampaignStatsCardsProps {
    totalCampaigns: number;
    totalReach: number;
    totalPointsGifted: number;
    marketingOptIn: number;
    totalClients: number;
}

export function CampaignStatsCards({
    totalCampaigns,
    totalReach,
    totalPointsGifted,
    marketingOptIn,
    totalClients,
}: CampaignStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Campañas Enviadas</CardDescription>
                    <Megaphone size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCampaigns}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total histórico</p>
                </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Alcance Total</CardDescription>
                    <Users size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalReach.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Personas impactadas</p>
                </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Puntos Regalados</CardDescription>
                    <Gift size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPointsGifted.toLocaleString()}</div>
                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                        <TrendingUp size={12} />
                        Inversión en fidelidad
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Opt-in Marketing</CardDescription>
                    <MessageCircle size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{marketingOptIn}/{totalClients}</div>
                    <p className="text-xs text-muted-foreground mt-1">Aceptan WhatsApp</p>
                </CardContent>
            </Card>
        </div>
    );
}
