"use client";

import { Users, ShieldCheck, Gift, TrendingUp, BarChart3 } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";

interface ClientsStatsCardsProps {
    totalClients: number;
    pendingCount: number;
    totalPoints: number;
}

export function ClientsStatsCards({ totalClients, pendingCount, totalPoints }: ClientsStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-border/50 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Total Clientes</CardDescription>
                    <Users size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalClients.toLocaleString()}</div>
                    <p className="text-xs text-success mt-1 flex items-center gap-1 font-medium">
                        <TrendingUp size={12} />
                        +12% este mes
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Esperando Canje</CardDescription>
                    <Gift size={16} className={pendingCount > 0 ? "text-destructive" : "text-muted-foreground"} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingCount.toLocaleString()}</div>
                    <p className={`text-xs mt-1 font-medium ${pendingCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
                        {pendingCount > 0 ? "Requieren acción" : "Todo al día"}
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Tickets Hoy</CardDescription>
                    <ShieldCheck size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Escaneos registrados</p>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription className="text-sm font-medium">Puntos en Juego</CardDescription>
                    <BarChart3 size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Total acumulado</p>
                </CardContent>
            </Card>
        </div>
    );
}
