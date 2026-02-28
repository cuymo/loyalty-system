"use server";

import { db } from "@/db";
import { clients, nameChangesHistory, adminNotifications } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getClientSession, destroyClientSession } from "@/lib/auth/client-jwt";
import { triggerWebhook } from "@/lib/webhook";
import { eventBus } from "@/lib/events";
import { processReferral } from "@/features/client/referrals/actions/client-referrals-logic";
import { getPublicSettings } from "@/features/auth/actions/client-auth";

/**
ID: act_0008
Vinculación de un código de referido a la cuenta del cliente actual para otorgar beneficios mutuos.
*/
export async function applyReferralCode(code: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const cleanCode = code.replace(/\D/g, "");
    const referrerId = parseInt(cleanCode);
    if (isNaN(referrerId)) return { success: false, error: "Código inválido" };

    if (referrerId === session.clientId) {
        return { success: false, error: "No puedes usar tu propio código" };
    }

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return { success: false, error: "Cliente no encontrado" };
    if (client.referredBy) {
        return { success: false, error: "Ya has canjeado un código de referido anteriormente" };
    }

    const [referrer] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, referrerId))
        .limit(1);

    if (!referrer) {
        return { success: false, error: "El código de referido no existe" };
    }

    try {
        await db.transaction(async (tx) => {
            const result = await processReferral(tx, referrerId, session.clientId, true);
            if (!result.success) throw new Error(result.error);
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error al aplicar referido:", e);
        return { success: false, error: e.message || "Error interno al procesar el código" };
    }
}

/**
ID: act_0009
Bloque de funciones para la gestión de perfil de usuario, incluyendo niveles VIP y cambios de nombre.
*/

/**
ID: act_0010
Recuperación del perfil completo del cliente, calculando el nivel VIP y los cambios de nombre restantes en el ciclo actual.
*/
export async function getClientProfile() {
    const session = await getClientSession();
    if (!session) return null;

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return null;

    // Logic for 2 name changes per membership year
    const registrationDate = client.createdAt;
    const now = new Date();

    let membershipYearStart = new Date(registrationDate);
    membershipYearStart.setFullYear(now.getFullYear());

    if (now < membershipYearStart) {
        membershipYearStart.setFullYear(now.getFullYear() - 1);
    }

    let membershipYearEnd = new Date(membershipYearStart);
    membershipYearEnd.setFullYear(membershipYearStart.getFullYear() + 1);

    const pastChangesInYear = await db
        .select()
        .from(nameChangesHistory)
        .where(
            and(
                eq(nameChangesHistory.clientId, session.clientId),
                gte(nameChangesHistory.createdAt, membershipYearStart),
                lte(nameChangesHistory.createdAt, membershipYearEnd)
            )
        );

    const changesRemaining = Math.max(0, 2 - pastChangesInYear.length);

    // VIP Tier Logic
    const pubSettings = await getPublicSettings();
    const tierBronze = parseInt(pubSettings.tier_bronze_points || "100");
    const tierSilver = parseInt(pubSettings.tier_silver_points || "500");
    const tierGold = parseInt(pubSettings.tier_gold_points || "1000");
    const tierVip = parseInt(pubSettings.tier_vip_points || "5000");

    let currentTier = "none";
    let nextTierPoints = tierBronze;
    let nextTierName = "Bronce";

    if (client.lifetimePoints >= tierVip) {
        currentTier = "vip";
        nextTierPoints = tierVip; // Reached max
        nextTierName = "Nivel Máximo";
    } else if (client.lifetimePoints >= tierGold) {
        currentTier = "gold";
        nextTierPoints = tierVip;
        nextTierName = "VIP";
    } else if (client.lifetimePoints >= tierSilver) {
        currentTier = "silver";
        nextTierPoints = tierGold;
        nextTierName = "Oro";
    } else if (client.lifetimePoints >= tierBronze) {
        currentTier = "bronze";
        nextTierPoints = tierSilver;
        nextTierName = "Plata";
    }

    const vip = {
        currentTier,
        nextTierPoints,
        nextTierName,
        lifetimePoints: client.lifetimePoints
    };

    return { ...client, changesRemaining, vip };
}

/**
ID: act_0011
Actualización de los datos del perfil del cliente, manejando restricciones en el cambio de nombre de usuario.
*/
export async function updateClientProfile(data: {
    username?: string;
    avatarSvg?: string;
    wantsMarketing?: boolean;
    wantsTransactional?: boolean;
}) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const [currentClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!currentClient) return { success: false, error: "Cliente no encontrado" };

    if (data.username && data.username !== currentClient.username) {
        const [existing] = await db
            .select()
            .from(clients)
            .where(eq(clients.username, data.username))
            .limit(1);

        if (existing && existing.id !== session.clientId) {
            return { success: false, error: "Nombre de usuario ya en uso" };
        }

        // Logic for 2 name changes per membership year
        const registrationDate = currentClient.createdAt;
        const now = new Date();

        let membershipYearStart = new Date(registrationDate);
        membershipYearStart.setFullYear(now.getFullYear());

        if (now < membershipYearStart) {
            membershipYearStart.setFullYear(now.getFullYear() - 1);
        }

        let membershipYearEnd = new Date(membershipYearStart);
        membershipYearEnd.setFullYear(membershipYearStart.getFullYear() + 1);

        const pastChangesInYear = await db
            .select()
            .from(nameChangesHistory)
            .where(
                and(
                    eq(nameChangesHistory.clientId, session.clientId),
                    gte(nameChangesHistory.createdAt, membershipYearStart),
                    lte(nameChangesHistory.createdAt, membershipYearEnd)
                )
            );

        if (pastChangesInYear.length >= 2) {
            return { success: false, error: "Has alcanzado el límite de 2 cambios de nombre por año de membresía." };
        }
    }

    if (data.username && data.username !== currentClient.username) {
        await db.transaction(async (tx) => {
            await tx.update(clients).set(data).where(eq(clients.id, session.clientId));
            await tx.insert(nameChangesHistory).values({
                clientId: session.clientId,
                oldNames: [currentClient.username],
                newName: data.username as string,
            });
        });
    } else {
        await db.update(clients).set(data).where(eq(clients.id, session.clientId));
    }

    if (data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional) {
        await triggerWebhook("cliente.perfil_actualizado", {
            clientId: session.clientId,
            username: data.username || currentClient.username,
            avatarSvg: data.avatarSvg || currentClient.avatarSvg,
            phone: session.phone,
            wantsMarketing: data.wantsMarketing !== undefined ? data.wantsMarketing : currentClient.wantsMarketing,
            wantsTransactional: data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional
        });
    }



    await db.insert(adminNotifications).values({
        type: "client_updated_profile",
        message: `Cliente actualizó su perfil: ${data.username || currentClient.username}`,
        isRead: false
    });

    revalidatePath("/");
    return { success: true };
}

/**
ID: act_0016
Cierre de sesión del cliente mediante la destrucción de la cookie de sesión actual.
*/
export async function logoutClient() {
    await destroyClientSession();
}

/**
ID: act_0017
Eliminación lógica de la cuenta del cliente (soft delete), anonimizando el usuario y notificando al sistema.
*/
export async function deleteMyAccount() {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    // Anonimizar username para liberarlo (otros pueden elegirlo)
    const deletedUsername = `deleted_${session.clientId}_${Date.now()}`;

    const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);

    await db.update(clients).set({
        username: deletedUsername,
        points: 0,
        avatarSvg: "default.svg",
        wantsMarketing: false,
        wantsTransactional: false,
        deletedAt: new Date(),
    }).where(eq(clients.id, session.clientId));

    if (c?.wantsTransactional) {
        await triggerWebhook("cliente.cuenta_eliminada", {
            clientId: session.clientId,
            phone: session.phone,
            username: session.username,
            deletedAt: new Date().toISOString(),
        });
    }

    await db.insert(adminNotifications).values({
        type: "client_deleted",
        message: `Cliente eliminó su cuenta: ${session.username} (${session.phone})`,
        isRead: false,
    });

    eventBus.emit("admin_notification", {
        type: "client_deleted",
        message: `Cliente eliminó su cuenta: ${session.username} (${session.phone})`,
    });

    await destroyClientSession();
    return { success: true };
}

