/**
 * actions/admin/redemptions.ts
 * Descripcion: Server Actions para gestión de canjes (aprobar/rechazar)
 * Fecha de creacion: 2026-02-28
 */
"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { redemptions, clients, rewards, appNotifications, adminNotifications } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { triggerWebhook } from "@/lib/webhook";

export async function getPendingRedemptions() {
    await requireAdminSession();
    return db
        .select({
            id: redemptions.id,
            ticketUuid: redemptions.ticketUuid,
            pointsSpent: redemptions.pointsSpent,
            status: redemptions.status,
            createdAt: redemptions.createdAt,
            clientName: clients.username,
            clientPhone: clients.phone,
            clientAvatar: clients.avatarSvg,
            rewardName: rewards.name,
            rewardImage: rewards.imageUrl,
        })
        .from(redemptions)
        .leftJoin(clients, eq(redemptions.clientId, clients.id))
        .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
        .where(eq(redemptions.status, "pending"))
        .orderBy(desc(redemptions.createdAt));
}

export async function approveRedemption(redemptionId: number) {
    await requireAdminSession();
    const [redemption] = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.id, redemptionId))
        .limit(1);

    if (!redemption) return;

    await db
        .update(redemptions)
        .set({ status: "approved" })
        .where(eq(redemptions.id, redemptionId));

    // Get client and reward info for webhook
    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, redemption.clientId))
        .limit(1);

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, redemption.rewardId))
        .limit(1);

    // Siempre In-App
    if (client) {
        await db.insert(appNotifications).values({
            clientId: client.id,
            title: "¡Canje Aprobado!",
            body: `Tu solicitud de canje por "${reward?.name || 'Desconocido'}" ha sido aprobada. ¡Disfrútalo!`,
            isRead: false,
            type: "reward_available" as const
        });

        // Opcional por WhatsApp
        if (client.wantsTransactional) {
            await triggerWebhook("cliente.canje_exitoso", {
                ticketUuid: redemption.ticketUuid,
                clientId: redemption.clientId,
                username: client.username || "Desconocido",
                phone: client.phone || "",
                rewardId: redemption.rewardId,
                rewardName: reward?.name || "Desconocido",
                pointsSpent: redemption.pointsSpent,
                status: "approved"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "admin_approved_redemption",
        message: `Admin Aprobó canje de ${client?.username || "Desconocido"} por ${reward?.name || "Desconocido"}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
}

export async function rejectRedemption(redemptionId: number, reason?: string) {
    await requireAdminSession();
    const [redemption] = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.id, redemptionId))
        .limit(1);

    if (!redemption) return;

    await db
        .update(redemptions)
        .set({ status: "rejected" })
        .where(eq(redemptions.id, redemptionId));

    // Refund points to client Atomically
    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, redemption.clientId))
        .limit(1);

    if (client) {
        await db
            .update(clients)
            .set({ points: sql`${clients.points} + ${redemption.pointsSpent}` })
            .where(eq(clients.id, redemption.clientId));
    }

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, redemption.rewardId))
        .limit(1);

    // Siempre In-App
    if (client) {
        await db.insert(appNotifications).values({
            clientId: client.id,
            title: "Canje Rechazado",
            body: `Tu solicitud de canje por "${reward?.name || 'Desconocido'}" fue rechazada. Motivo: ${reason || 'Contacta soporte'}. Tus puntos (${redemption.pointsSpent}) han sido devueltos.`,
            isRead: false,
            type: "points_earned" as const
        });

        // Opcional por WhatsApp
        if (client.wantsTransactional) {
            await triggerWebhook("cliente.canje_rechazado", {
                ticketUuid: redemption.ticketUuid,
                clientId: redemption.clientId,
                username: client.username || "Desconocido",
                phone: client.phone || "",
                rewardId: redemption.rewardId,
                rewardName: reward?.name || "Desconocido",
                pointsSpent: redemption.pointsSpent,
                reason: reason || "Rechazado por el administrador",
                status: "rejected"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "admin_rejected_redemption",
        message: `Admin Rechazó canje de ${client?.username || "Desconocido"} por ${reward?.name || "Desconocido"}. Motivo: ${reason || "N/A"}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
}
