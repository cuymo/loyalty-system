"use server";

import { db } from "@/db";
import { appNotifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getClientSession } from "@/lib/auth/client-jwt";

/**
ID: act_0012
Sección de acciones para la gestión de notificaciones internas del sistema para el cliente.
*/

/**
ID: act_0013
Consulta del número de notificaciones no leídas para mostrar indicadores en la interfaz.
*/
export async function getUnreadNotificationsCount() {
    const session = await getClientSession();
    if (!session) return 0;

    const unread = await db
        .select()
        .from(appNotifications)
        .where(
            and(
                eq(appNotifications.clientId, session.clientId),
                eq(appNotifications.isRead, false)
            )
        );

    return unread.length;
}

/**
ID: act_0014
Recuperación de la lista de notificaciones recientes del cliente, ordenadas cronológicamente.
*/
export async function getAppNotifications() {
    const session = await getClientSession();
    if (!session) return [];

    return db
        .select()
        .from(appNotifications)
        .where(eq(appNotifications.clientId, session.clientId))
        .orderBy(desc(appNotifications.createdAt))
        .limit(20);
}

/**
ID: act_0015
Marca todas las notificaciones pendientes como leídas y revalida la ruta de notificaciones.
*/
export async function markNotificationsAsRead() {
    const session = await getClientSession();
    if (!session) return { success: false };

    await db
        .update(appNotifications)
        .set({ isRead: true })
        .where(
            and(
                eq(appNotifications.clientId, session.clientId),
                eq(appNotifications.isRead, false)
            )
        );

    revalidatePath("/client/notifications");
    return { success: true };
}

