"use server";

import { db } from "@/db";
import { clients, codes, appNotifications, adminNotifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getClientSession } from "@/lib/auth/client-jwt";
import { triggerWebhook } from "@/lib/webhook";
import { eventBus } from "@/lib/events";
import { getPublicSettings } from "@/features/auth/actions/client-auth";

/**
ID: act_0018
Sección de acciones para el procesamiento de códigos QR y asignación de puntos.
*/

/**
ID: act_0019
Validación preliminar de un código QR para verificar su existencia, vigencia y estado de uso.
*/
export async function validateCode(codeStr: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const result = await db
        .select()
        .from(codes)
        .where(eq(codes.code, codeStr))
        .limit(1);

    if (!result.length) {
        return { success: false, error: "Codigo no encontrado" };
    }

    const code = result[0];

    if (code.status === "used") {
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }

    const now = new Date();
    if (now > code.expirationDate) {
        return { success: false, error: "Este código ya ha expirado" };
    }

    return {
        success: true,
        pointsValue: code.pointsValue,
    };
}

/**
ID: act_0020
Procesamiento atómico del canje de un código QR, sumando puntos al cliente y marcando el código como usado.
*/
export async function redeemCode(codeStr: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const result = await db
        .select()
        .from(codes)
        .where(eq(codes.code, codeStr))
        .limit(1);

    if (!result.length) {
        return { success: false, error: "Codigo no encontrado" };
    }

    const code = result[0];

    if (code.status === "used") {
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }

    const now = new Date();
    if (now > code.expirationDate) {
        return { success: false, error: "Este código ya ha expirado" };
    }

    // Transaccion ACID: marcar codigo como usado + sumar puntos
    const transactionResult = await db.transaction(async (tx) => {
        const updateCodeResult = await tx
            .update(codes)
            .set({
                status: "used",
                usedAt: new Date(),
                usedBy: session.clientId,
            })
            .where(
                and(
                    eq(codes.id, code.id),
                    eq(codes.status, "unused") // Atomic constraint
                )
            ).returning();

        if (updateCodeResult.length === 0) {
            throw new Error("El código ya fue reclamado por otro proceso");
        }

        await tx
            .update(clients)
            .set({
                points: sql`${clients.points} + ${code.pointsValue}`,
                lifetimePoints: sql`${clients.lifetimePoints} + ${code.pointsValue}`,
            })
            .where(eq(clients.id, session.clientId));

        return true;
    }).catch((e) => {
        return false;
    });

    if (!transactionResult) {
        return { success: false, error: "El código ya fue reclamado por otro proceso paralelo" };
    }

    // Get updated client for total points
    const [updatedClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    // Opcional por WhatsApp (Transaccional)
    if (updatedClient?.wantsTransactional) {
        await triggerWebhook("cliente.puntos_sumados", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            code: codeStr,
            pointsAdded: code.pointsValue,
            batchName: code.batchName,
            newTotalPoints: updatedClient.points
        });
    }

    // Siempre notificar In-App
    await db.insert(appNotifications).values({
        clientId: session.clientId,
        title: "¡Puntos Sumados!",
        body: `Has sumado ${code.pointsValue} puntos. Tu nuevo total es ${updatedClient?.points ?? 0} pts.`,
        isRead: false,
        type: "points_earned"
    });

    await db.insert(adminNotifications).values({
        type: "points_added",
        message: `Cliente sumó puntos: ${session.username} sumó ${code.pointsValue} pts (Lote: ${code.batchName})`,
        isRead: false
    });

    if (updatedClient) {
        const oldLifetime = updatedClient.lifetimePoints - code.pointsValue;

        const pubSettings = await getPublicSettings();
        const tierBronze = parseInt(pubSettings.tier_bronze_points || "100");
        const tierSilver = parseInt(pubSettings.tier_silver_points || "500");
        const tierGold = parseInt(pubSettings.tier_gold_points || "1000");
        const tierVip = parseInt(pubSettings.tier_vip_points || "5000");

        const getTier = (pts: number) => {
            if (pts >= tierVip) return "vip";
            if (pts >= tierGold) return "gold";
            if (pts >= tierSilver) return "silver";
            if (pts >= tierBronze) return "bronze";
            return "none";
        };

        const oldTier = getTier(oldLifetime);
        const newTier = getTier(updatedClient.lifetimePoints);

        if (oldTier !== newTier) {
            if (updatedClient.wantsTransactional) {
                await triggerWebhook("cliente.nivel_alcanzado", {
                    clientId: session.clientId,
                    username: session.username,
                    phone: session.phone,
                    oldTier,
                    newTier,
                    lifetimePoints: updatedClient.lifetimePoints
                });
            }

            await db.insert(appNotifications).values({
                clientId: session.clientId,
                title: "¡Subiste de Nivel VIP!",
                body: `¡Felicidades! Has alcanzado el nivel ${newTier.toUpperCase()}. Disfruta de nuevos beneficios y premios exclusivos.`,
                isRead: false,
                type: "campaign_only_text"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "points_added",
        message: `${session.username} sumó ${code.pointsValue} pts`,
        isRead: false
    });

    eventBus.emit("admin_notification", {
        type: "points_added",
        message: `${session.username} sumó ${code.pointsValue} pts`,
    });

    revalidatePath("/");
    return {
        success: true,
        pointsAdded: code.pointsValue,
    };
}

