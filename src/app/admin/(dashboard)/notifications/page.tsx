import { requireAdminSession } from "@/lib/auth/require-admin";
import { db } from "@/db";
import { adminNotifications } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { NotificationsClient } from "./notifications-client";
import { markAdminNotificationsAsRead } from "@/actions/admin";

export const metadata = {
    title: "Notificaciones y Registro de Actividad - Crew Zingy",
};

export default async function AdminNotificationsPage() {
    await requireAdminSession();

    // Marcar todas como leídas al entrar a la página (opcional pero UX friendly)
    await markAdminNotificationsAsRead();

    // Obtener SOLO el historial de notificaciones externas/clientes
    const history = await db
        .select()
        .from(adminNotifications)
        .where(inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"]))
        .orderBy(desc(adminNotifications.createdAt))
        .limit(500);

    const mappedHistory = history.map(d => ({
        id: d.id.toString(),
        type: d.type,
        message: d.message,
        timestamp: d.createdAt,
    }));

    return <NotificationsClient initialData={mappedHistory} />;
}
