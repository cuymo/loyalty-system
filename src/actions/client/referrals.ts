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
    const shareMessage = set.ref_share_message || "Usa mi link: {{link}}";
    const milestonesStr = set.ref_milestones || '[{"id":1,"amount":3,"reward":50}]';
    let milestones = [];
    try { milestones = JSON.parse(milestonesStr); } catch { milestones = [{ "id": 1, "amount": 3, "reward": 50 }]; }

    // Sort by amount ascending to ensure sequential logic
    milestones.sort((a: any, b: any) => a.amount - b.amount);

    // Contar cuántos ha recibido o dado HISTÓRICAMENTE como referrer
    const allReferralsAsReferrer = await db.select().from(referralHistory)
        .where(eq(referralHistory.referrerId, clientId));

    const totalRef = allReferralsAsReferrer.length;

    // Calcular en qué ciclo de meta está
    let currentCycleIndex = 0;
    while (currentCycleIndex < milestones.length) {
        if (totalRef < milestones[currentCycleIndex].amount) {
            break;
        }
        currentCycleIndex++;
    }

    // Default to the last milestone logic if they exceeded all
    const activeMilestone = milestones[currentCycleIndex] || milestones[milestones.length - 1];
    const previousMilestoneAmount = currentCycleIndex > 0 ? milestones[Math.min(currentCycleIndex - 1, milestones.length - 1)].amount : 0;

    // Si ya completó TODO, podemos dejar limit=amount y expected=amount, o manejar overflow.
    // Usaremos "Progreso dentro del lote actual"
    const totalAccounted = currentCycleIndex >= milestones.length ? 0 : previousMilestoneAmount;
    const progressInCurrentCycle = currentCycleIndex >= milestones.length ? activeMilestone.amount : totalRef - totalAccounted;
    const limitForCurrentCycle = currentCycleIndex >= milestones.length ? activeMilestone.amount : activeMilestone.amount - totalAccounted;

    return {
        enabled,
        usedThisMonth: progressInCurrentCycle,
        limit: limitForCurrentCycle,
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

    const totalRefBefore = allReferralsAsReferrer.length;
    const totalRefAfter = totalRefBefore + 1; // Le sumamos 1 porque es el nuevo referido actual

    const milestonesStr = set.ref_milestones || '[{"id":1,"amount":3,"reward":50}]';
    let milestones: { id: number, amount: number, reward: number }[] = [];
    try { milestones = JSON.parse(milestonesStr); } catch { milestones = [{ id: 1, amount: 3, reward: 50 }]; }

    milestones.sort((a, b) => a.amount - b.amount);

    const bonusReferred = parseInt(set.ref_points_referred || "1"); // 1 punto base para quien usa el código
    let pointsForReferrer = 0;

    // Check if totalRefAfter EXACTLY hits any milestone amount
    const hitMilestone = milestones.find(m => m.amount === totalRefAfter);
    if (hitMilestone) {
        // Meta alcanzada!
        pointsForReferrer = hitMilestone.reward;
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
