/**
ID: ui_0008
Indicador de notificaciones (campana) para el cliente, con conteo en tiempo real de mensajes no leídos.
*/
"use client"

import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadNotificationsCount } from "@/features/client/notifications/actions/client-notifications";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ClientNotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        // Clear dot automatically if we are on the notifications page
        if (pathname === "/client/notifications") {
            setUnreadCount(0);
        } else {
            // Fetch unread count asynchronously only on mount or path change
            const fetchCount = async () => {
                try {
                    const count = await getUnreadNotificationsCount();
                    setUnreadCount(count);
                } catch (e) {
                    console.error("Failed to fetch notifications", e);
                }
            };

            fetchCount();
        }
    }, [pathname]);

    return (
        <Button variant="ghost" size="icon" asChild className="relative rounded-full w-9 h-9 border border-border bg-card text-foreground hover:bg-accent transition-colors">
            <Link
                href="/client/notifications"
                prefetch={true}
                onClick={() => setUnreadCount(0)}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
            </Link>
        </Button>
    );
}

