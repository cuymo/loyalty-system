/**
 * actions/admin/notifications.ts
 * Descripcion: Server Actions para notificaciones manuales (custom push a clientes)
 * Fecha de creacion: 2026-02-28
 */
"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { clients, appNotifications } from "@/db/schema";
import { and, inArray, isNull } from "drizzle-orm";
import { triggerWebhook } from "@/lib/webhook";

export async function sendCustomNotification(
    targetIds: number[] | 'all',
    data: {
        title: string;
        body: string;
        imageUrl?: string;
        sendToApp: boolean;
        sendToWhatsapp: boolean;
    }
) {
    await requireAdminSession();
    let clientsList;
    if (targetIds === 'all') {
        clientsList = await db.select().from(clients).where(isNull(clients.deletedAt));
    } else {
        clientsList = await db.select().from(clients).where(and(inArray(clients.id, targetIds), isNull(clients.deletedAt)));
    }

    if (clientsList.length === 0) return { success: false, error: "No hay clientes seleccionados" };

    if (data.sendToApp) {
        const inAppNotifs = clientsList
            .map(c => ({
                clientId: c.id,
                title: data.title,
                body: data.body,
                type: (data.imageUrl ? "campaign_with_image" : "campaign_only_text") as "campaign_with_image" | "campaign_only_text",
                isRead: false
            }));

        if (inAppNotifs.length > 0) {
            await db.insert(appNotifications).values(inAppNotifs);
        }
    }

    if (data.sendToWhatsapp) {
        const whatsappTargets = clientsList
            .filter(c => c.wantsMarketing)
            .map(c => ({
                id: c.id,
                phone: c.phone,
                username: c.username,
                points: c.points
            }));

        if (whatsappTargets.length > 0) {
            await triggerWebhook("admin.notificacion_custom_whatsapp", {
                title: data.title,
                body: data.body,
                imageUrl: data.imageUrl || null,
                targets: whatsappTargets
            });
        }
    }

    return { success: true };
}

// ============================================
// ADMIN NOTIFICATIONS (migrated from monolithic)
// ============================================

export async function getAdminNotifications() {
    await requireAdminSession();
    return db
        .select()
        .from(adminNotifications)
        .where(inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"]))
        .orderBy(desc(adminNotifications.createdAt))
        .limit(20);
}

export async function getAdminUnreadCount() {
    await requireAdminSession();
    const unread = await db
        .select()
        .from(adminNotifications)
        .where(
            and(
                eq(adminNotifications.isRead, false),
                inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"])
            )
        );
    return unread.length;
}

export async function markAdminNotificationsAsRead() {
    await requireAdminSession();
    await db
        .update(adminNotifications)
        .set({ isRead: true })
        .where(
            and(
                eq(adminNotifications.isRead, false),
                inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"])
            )
        );
    return { success: true };
}

