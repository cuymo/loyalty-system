"use client";

import { useEffect, useState } from "react";
import { markNotificationsAsRead } from "@/features/client/notifications/actions/client-notifications";
import { Bell, Trophy, Info, Gift, CheckCircle2 } from "lucide-react";

interface AppNotification {
    id: number;
    clientId: number;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationsClientProps {
    initialNotifications: AppNotification[];
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const [notifications, setNotifications] = useState(initialNotifications);

    useEffect(() => {
        const hasUnread = notifications.some(n => !n.isRead);

        if (hasUnread) {
            // Mark as read in the database
            markNotificationsAsRead().then((res) => {
                if (res.success) {
                    // Update local state to reflect all are read
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                }
            });
        }
    }, [notifications]);

    const getNotificationDot = (type: string) => {
        switch (type) {
            case "reward_available":
            case "admin_custom":
                return <div className="w-2.5 h-2.5 rounded-full bg-warning mt-1" />;
            case "new_reward":
            case "birthday_gift":
                return <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />;
            case "success":
            case "referral_success":
            case "tier_upgraded":
            case "points_added":
                return <div className="w-2.5 h-2.5 rounded-full bg-success mt-1" />;
            case "login":
                return <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground mt-1" />;
            case "account_reactivated":
            default:
                return <div className="w-2.5 h-2.5 rounded-full bg-info mt-1" />;
        }
    };

    if (notifications.length === 0) {
        return (
            <div className="max-w-md mx-auto px-4 pt-10 pb-8 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-accent/50 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Sin notificaciones</h2>
                <p className="text-muted-foreground text-sm text-center">
                    Aún no tienes notificaciones. Aquí te avisaremos sobre premios disponibles.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Notificaciones</h1>
                <p className="text-muted-foreground text-sm">Tus avisos y alertas recientes</p>
            </div>

            <div className="space-y-3">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 rounded-2xl border transition-colors flex gap-4 
                            ${notif.isRead ? "bg-card border-border/50" : "bg-primary/5 border-primary/20"}
                        `}
                    >
                        <div className="mt-0.5 shrink-0 px-1">
                            {getNotificationDot(notif.type)}
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-sm font-medium leading-tight ${notif.isRead ? "text-foreground" : "text-primary"}`}>
                                {notif.title}
                            </h3>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                {notif.body}
                            </p>
                            <span className="text-[10px] text-muted-foreground/60 font-medium font-mono uppercase tracking-wider block mt-2">
                                {new Date(notif.createdAt).toLocaleString("es-EC", {
                                    timeZone: "America/Guayaquil",
                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
                                }).replace(/\./g, '')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
