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
    const enabled = set.ref_enabled === "true";
    const baseGoal = parseInt(set.ref_goal_base || "3");
    const increment = parseInt(set.ref_goal_increment || "2");
    const shareMessage = set.ref_share_message || "Usa mi link: {{link}}";

    // Contar cuántos ha recibido o dado HISTÓRICAMENTE como referrer
    const allReferralsAsReferrer = await db.select().from(referralHistory)
        .where(eq(referralHistory.referrerId, clientId));

    const totalRef = allReferralsAsReferrer.length;

    // Calcular en qué ciclo de meta está
    let currentCycle = 1;
    let referralsNeededForCurrentCycle = baseGoal;
    let totalAccounted = 0;

    while (totalRef >= totalAccounted + referralsNeededForCurrentCycle) {
        totalAccounted += referralsNeededForCurrentCycle;
        currentCycle++;
        referralsNeededForCurrentCycle = baseGoal + (currentCycle - 1) * increment;
    }

    const progressInCurrentCycle = totalRef - totalAccounted;

    return {
        enabled,
        usedThisMonth: progressInCurrentCycle, // Renombrado lógicamente para ui, pero es el progreso actual
        limit: referralsNeededForCurrentCycle,
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

    // 2. Limite vitalicio y Cuota por meta
    const allReferralsAsReferrer = await tx.select().from(referralHistory)
        .where(eq(referralHistory.referrerId, referrerId));

    const totalRef = allReferralsAsReferrer.length;
    const baseGoal = parseInt(set.ref_goal_base || "3");
    const increment = parseInt(set.ref_goal_increment || "2");

    const bonusReferred = parseInt(set.ref_points_referred || "1"); // 1 punto base para quien usa el código
    const bonusReferrer = parseInt(set.ref_points_referrer || "50"); // Premio al llenar meta

    // Calcular si la meta se completó con este nuevo referido (+1)
    let currentCycle = 1;
    let referralsNeededForCurrentCycle = baseGoal;
    let totalAccounted = 0;

    while (totalRef >= totalAccounted + referralsNeededForCurrentCycle) {
        totalAccounted += referralsNeededForCurrentCycle;
        currentCycle++;
        referralsNeededForCurrentCycle = baseGoal + (currentCycle - 1) * increment;
    }

    const progressInCurrentCycle = totalRef - totalAccounted + 1; // Le sumamos 1 porque es el nuevo referido actual
    let pointsForReferrer = 0;

    if (progressInCurrentCycle >= referralsNeededForCurrentCycle) {
        // Meta alcanzada!
        pointsForReferrer = bonusReferrer;
    }

    // Update Referrer
    await tx.update(clients).set({
        referralCount: sql`${clients.referralCount} + 1`,
        points: sql`${clients.points} + ${pointsForReferrer}`,
        lifetimePoints: sql`${clients.lifetimePoints} + ${pointsForReferrer}`
    }).where(eq(clients.id, referrerId));

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
            title: "¡Meta de Invitaciones Completada!",
            body: `Has completado tu meta actual de invitaciones. ¡Ganaste ${pointsForReferrer} puntos!`,
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
