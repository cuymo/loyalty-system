"use server";

import { db } from "@/db";
import { clients, rewards, redemptions, appNotifications, adminNotifications } from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getClientSession } from "@/lib/auth/client-jwt";
import { triggerWebhook } from "@/lib/webhook";
import { eventBus } from "@/lib/events";
import { randomUUID } from "crypto";

/**
ID: act_0021
Sección de acciones para la visualización y solicitud de canje de recompensas disponibles.
*/

/**
ID: act_0022
Listado de todas las recompensas con estado activo, ordenadas por costo de puntos.
*/
export async function getAvailableRewards() {
    return db
        .select()
        .from(rewards)
        .where(eq(rewards.status, "active"))
        .orderBy(rewards.pointsRequired);
}

/**
ID: act_0023
Generación de una solicitud de canje mediante una transacción atómica que verifica puntos y genera un ticket único.
*/
export async function requestRedemption(rewardId: number) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, rewardId))
        .limit(1);

    if (!reward) return { success: false, error: "Premio no encontrado" };
    if (reward.status !== "active")
        return { success: false, error: "Premio no disponible" };

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return { success: false, error: "Cliente no encontrado" };
    if (client.points < reward.pointsRequired)
        return { success: false, error: "Puntos insuficientes" };

    const ticketUuid = randomUUID();

    // Transaccion ACID: descontar puntos + crear ticket de forma Atomica
    const transactionResult = await db.transaction(async (tx) => {
        const updateClientResult = await tx
            .update(clients)
            .set({ points: sql`${clients.points} - ${reward.pointsRequired}` })
            .where(
                and(
                    eq(clients.id, session.clientId),
                    gte(clients.points, reward.pointsRequired) // Bloqueo anti-saldos negativos
                )
            ).returning();

        if (updateClientResult.length === 0) {
            throw new Error("Puntos insuficientes");
        }

        await tx.insert(redemptions).values({
            clientId: session.clientId,
            rewardId: rewardId,
            ticketUuid,
            pointsSpent: reward.pointsRequired,
            status: "pending",
        });

        return true;
    }).catch(e => false);

    if (!transactionResult) {
        return { success: false, error: "Tus puntos han cambiado o son insuficientes" };
    }

    // Siempre In-App
    await db.insert(appNotifications).values({
        clientId: session.clientId,
        title: "Solicitud de Canje",
        body: `Has solicitado canjear: ${reward.name}. Descontamos ${reward.pointsRequired} pts. Tu solicitud está pendiente de aprobación.`,
        isRead: false,
        type: "points_spent"
    });

    // Opcional por WhatsApp (Transaccional)
    if (client.wantsTransactional) {
        await triggerWebhook("cliente.canje_solicitado", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            wantsMarketing: client.wantsMarketing,
            wantsTransactional: client.wantsTransactional,
            rewardId,
            rewardName: reward.name,
            rewardType: reward.type,
            ticketUuid,
            pointsSpent: reward.pointsRequired,
            remainingPoints: client.points - reward.pointsRequired
        });
    }

    await db.insert(adminNotifications).values({
        type: "new_redemption",
        message: `${session.username} solicitó canjear: ${reward.name}`,
        isRead: false
    });

    eventBus.emit("admin_notification", {
        type: "new_redemption",
        message: `${session.username} solicitó canjear: ${reward.name}`,
    });

    revalidatePath("/");
    return { success: true, ticketUuid };
}

/**
ID: act_0024
Obtención del historial de canjes del cliente actual, incluyendo detalles de la recompensa y estado del ticket.
*/
export async function getMyRedemptions() {
    const session = await getClientSession();
    if (!session) return [];

    const rows = await db
        .select({
            id: redemptions.id,
            rewardId: redemptions.rewardId,
            ticketUuid: redemptions.ticketUuid,
            pointsSpent: redemptions.pointsSpent,
            status: redemptions.status,
            createdAt: redemptions.createdAt,
            rewardName: rewards.name,
            rewardImageUrl: rewards.imageUrl,
            rewardType: rewards.type,
        })
        .from(redemptions)
        .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
        .where(eq(redemptions.clientId, session.clientId))
        .orderBy(desc(redemptions.createdAt));

    return rows;
}

