/**
 * (client)/notifications/page.tsx
 * Descripcion: Pagina principal para ver el historial de notificaciones in-app
 */

import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";
import { getAppNotifications } from "@/features/client/notifications/actions/client-notifications";
import { NotificationsClient } from "@/features/client/notifications/components/notifications-client";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Notificaciones | Zingy",
};

export default async function NotificationsPage() {
    const session = await getClientSession();
    if (!session) redirect("/login");

    const notifications = await getAppNotifications();

    return <NotificationsClient initialNotifications={notifications} />;
}
