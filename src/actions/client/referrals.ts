/**
 * actions/client/referrals.ts
 * Descripcion: Lógica central para procesar referidos (mensuales, límites, bonos)
 * Fecha de creacion: 2026-02-26
 */
"use server";

import { db } from "@/db";
import { clients, referralHistory, appNotifications, settings } from "@/db/schema";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { triggerWebhook } from "@/lib/webhook";

export async function getReferralProgress(clientId: number) {
    const pubSettings = await db.select().from(settings);
    const set = pubSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value || "" }), {} as Record<string, string>);

    // Default values
    const limit = parseInt(set.ref_monthly_limit || "3");
    const shareMessage = set.ref_share_message || "Usa mi link: {{link}}";

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Contar cuántos ha recibido o dado este mes
    const monthReferrals = await db.select().from(referralHistory)
        .where(
            and(
                or(
                    eq(referralHistory.referrerId, clientId),
                    eq(referralHistory.referredId, clientId)
                ),
                gte(referralHistory.createdAt, startOfMonth),
                lte(referralHistory.createdAt, endOfMonth)
            )
        );

    return {
        usedThisMonth: monthReferrals.length,
        limit,
        shareMessage
    };
}

export async function processReferral(tx: any, referrerId: number, referredId: number, isPostRegistration = false) {
    const pubSettings = await db.select().from(settings);
    const set = pubSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value || "" }), {} as Record<string, string>);

    if (set.ref_enabled === "false") return { success: false, error: "El programa de referidos está temporalmente desactivado." };

    const referrer = await tx.select().from(clients).where(eq(clients.id, referrerId)).limit(1).then((res: any) => res[0]);
    const referred = await tx.select().from(clients).where(eq(clients.id, referredId)).limit(1).then((res: any) => res[0]);

    if (!referrer || !referred) return { success: false, error: "Usuario no encontrado." };

    // 1. Validar Anti-Repetición
    const existing = await tx.select().from(referralHistory).where(
        and(eq(referralHistory.referrerId, referrerId), eq(referralHistory.referredId, referredId))
    );
    if (existing.length > 0) return { success: false, error: "Ya has completado un ciclo de referido con este usuario antes." };

    // 2. Limite vitalicio y Cuota mensual de referrer
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReferrals = await tx.select().from(referralHistory)
        .where(and(eq(referralHistory.referrerId, referrerId), gte(referralHistory.createdAt, startOfMonth)));

    const monthlyLimit = parseInt(set.ref_monthly_limit || "3");
    const lifetimeLimit = parseInt(set.ref_lifetime_limit || "20");

    let pointsForReferrer = 0;

    // Determinando bonos dynamicamente según tier del referrer
    // Asumimos que los tiers se basan en lifetimePoints. 
    // Simplified logic para sacar su nivel y bono:
    const tierBronze = parseInt(set.tier_bronze_points || "100");
    const tierSilver = parseInt(set.tier_silver_points || "500");
    const tierGold = parseInt(set.tier_gold_points || "1000");
    const tierVip = parseInt(set.tier_vip_points || "5000");

    let bonusReferrer = parseInt(set.ref_points_referrer_bronze || "50"); // base
    if (referrer.lifetimePoints >= tierVip) bonusReferrer = parseInt(set.ref_points_referrer_vip || "150");
    else if (referrer.lifetimePoints >= tierGold) bonusReferrer = parseInt(set.ref_points_referrer_gold || "100");
    else if (referrer.lifetimePoints >= tierSilver) bonusReferrer = parseInt(set.ref_points_referrer_silver || "70");

    const bonusReferred = parseInt(set.ref_points_referred || "50");

    if (monthReferrals.length >= monthlyLimit) { // Excedió cuota mensual
        pointsForReferrer = 0; // Se asocia igual, pero sin ganar puntos el referente. (Opcional dar error: return { success: false, error: "Límite mensual del referente alcanzado."}; vamos a evitar error duro y solo no dar puntos)
    } else if (referrer.referralCount >= lifetimeLimit) {
        pointsForReferrer = 0;
    } else {
        pointsForReferrer = bonusReferrer;
        // Update Referrer
        await tx.update(clients).set({
            referralCount: sql`${clients.referralCount} + 1`,
            points: sql`${clients.points} + ${pointsForReferrer}`,
            lifetimePoints: sql`${clients.lifetimePoints} + ${pointsForReferrer}`
        }).where(eq(clients.id, referrerId));
    }

    // Update Referred
    await tx.update(clients).set({
        referredBy: referrerId,
        points: sql`${clients.points} + ${bonusReferred}`,
        lifetimePoints: sql`${clients.lifetimePoints} + ${bonusReferred}`
    }).where(eq(clients.id, referredId));

    // Register History
    await tx.insert(referralHistory).values({
        referrerId,
        referredId,
        pointsReferrer: pointsForReferrer,
        pointsReferred: bonusReferred
    });

    // Notifications
    await tx.insert(appNotifications).values({
        clientId: referredId,
        title: "Código de Invitación Aplicado",
        body: `Has recibido ${bonusReferred} puntos por el código de ${referrer.username}.`,
        isRead: false,
        type: "referral_success"
    });

    if (pointsForReferrer > 0) {
        await tx.insert(appNotifications).values({
            clientId: referrerId,
            title: "¡Bono de Invitación!",
            body: `${referred.username} usó tu invitación. ¡Ganaste ${pointsForReferrer} puntos!`,
            isRead: false,
            type: "referral_success"
        });
    }

    if (referrer.wantsTransactional || referred.wantsTransactional) {
        // Trigger webhook asincrono (no bloquea TX por lo general, pero aquí se espera; debería estar seguro)
        await triggerWebhook("cliente.referido", {
            referrerId,
            referrerUsername: referrer.username,
            newClientId: referredId,
            newClientUsername: referred.username,
            pointsAwardedToReferrer: pointsForReferrer,
            pointsAwardedToReferred: bonusReferred,
            isPostRegistration: isPostRegistration
        }).catch(() => { });
    }

    return {
        success: true,
        pointsReferred: bonusReferred,
        pointsReferrer: pointsForReferrer
    };
}
