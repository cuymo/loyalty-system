"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Activity,
    AlertTriangle,
    Gift,
    LogOut,
    RefreshCw,
    ShieldAlert,
    Trash2,
    Trophy,
    User,
    UserPlus,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type RawHistoryItem = {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
};

export function NotificationsClient({ initialData }: { initialData: RawHistoryItem[] }) {

    // Mapping function to decorate events with Icons and Colors
    const categorizeEvent = (type: string) => {
        switch (type) {
            // SEGURIDAD & ACCESO (Violacion de seguridad, Bloqueos, Danger Zone)
            case "danger_zone":
                return { category: "security", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10" };
            case "admin_login":
            case "client_blocked":
                return { category: "security", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" };

            // PREMIOS & CANJES (Redenciones, creacion de premios, escaneos)
            case "admin_created_reward":
            case "admin_updated_reward":
            case "admin_deleted_reward":
            case "new_redemption":
            case "admin_approved_redemption":
            case "admin_rejected_redemption":
                return { category: "rewards", icon: Gift, color: "text-primary", bg: "bg-primary/10" };

            case "points_added":
                return { category: "rewards", icon: Trophy, color: "text-warning", bg: "bg-warning/10" };

            // LOTES & CODIGOS
            case "admin_generated_codes":
            case "admin_deleted_batch":
                return { category: "codes", icon: RefreshCw, color: "text-info", bg: "bg-info/10" };

            // CLIENTES (Registros, borrados, cambios de perfil)
            case "new_client":
                return { category: "clients", icon: UserPlus, color: "text-success", bg: "bg-success/10" };
            case "client_updated_profile":
                return { category: "clients", icon: User, color: "text-info", bg: "bg-info/10" };
            case "client_deleted":
            case "admin_deleted_client":
                return { category: "clients", icon: Trash2, color: "text-muted-foreground", bg: "bg-muted" };

            // AJUSTES
            case "admin_updated_setting":
                return { category: "settings", icon: Activity, color: "text-muted-foreground", bg: "bg-muted" };

            // DEFAULT
            default:
                return { category: "other", icon: Activity, color: "text-foreground", bg: "bg-accent" };
        }
    };

    const enrichedData = initialData.map(item => ({
        ...item,
        ...categorizeEvent(item.type)
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Notificaciones</h1>
                    <p className="text-muted-foreground mt-1">
                        Avisos y alertas recientes del sistema.
                    </p>
                </div>
            </div>

            <Card className="border-border bg-card shadow-sm">
                <CardContent className="pt-6">
                    {enrichedData.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                            No tienes nuevas notificaciones.
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-border/50 ml-4 py-2 space-y-8">
                            {enrichedData.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.id} className="relative pl-8 pr-4 group">
                                        <div className={`absolute top-0 -left-[17px] w-8 h-8 rounded-full flex items-center justify-center border-4 border-card ${item.bg} ${item.color} shadow-sm transition-transform group-hover:scale-110`}>
                                            <Icon size={14} className="stroke-[2.5]" />
                                        </div>

                                        {/* Content Box */}
                                        <div className="bg-card/50 hover:bg-muted/40 transition-colors border border-border/50 rounded-lg p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.bg} ${item.color} inline-block w-fit`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                                    {format(new Date(item.timestamp), "d MMM yyyy, h:mm a", { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground leading-snug">
                                                {item.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
