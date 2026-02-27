/**
 * actions/admin/referrals.ts
 * Descripcion: Server Actions exclusivas para el modulo de Referidos
 * Fecha de creacion: 2026-02-26
 * Autor: Crew Zingy Dev
 */
"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { settings, referralHistory, clients, adminNotifications } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const REFERRAL_SETTINGS_KEYS = [
    "ref_enabled",
    "ref_milestones",
    "ref_monthly_limit",
    "ref_lifetime_limit",
    "ref_cooldown_hours",
    "ref_points_referrer_bronze",
    "ref_points_referrer_silver",
    "ref_points_referrer_gold",
    "ref_points_referrer_vip",
    "ref_points_referred",
    "ref_share_message"
];

const DEFAULT_REFERRAL_SETTINGS: Record<string, string> = {
    "ref_enabled": "true",
    "ref_milestones": '[{"id":1,"amount":3,"reward":50}]',
    "ref_monthly_limit": "3",
    "ref_lifetime_limit": "20",
    "ref_cooldown_hours": "0",
    "ref_points_referrer_bronze": "50",
    "ref_points_referrer_silver": "70",
    "ref_points_referrer_gold": "100",
    "ref_points_referrer_vip": "150",
    "ref_points_referred": "50",
    "ref_share_message": "¡Regístrate en Crew Zingy usando mi código {{link}} y gana regalos en tu primera compra!"
};

// ============================================
// CONFIGURACIONES DEL MODULO
// ============================================

export async function getReferralSettings() {
    await requireAdminSession();
    const all = await db.select().from(settings).where(inArray(settings.key, REFERRAL_SETTINGS_KEYS));

    // Si faltan llaves, las añadimos
    const existingKeys = all.map(s => s.key);
    const missingKeys = REFERRAL_SETTINGS_KEYS.filter(k => !existingKeys.includes(k));

    if (missingKeys.length > 0) {
        await db.insert(settings).values(missingKeys.map(k => ({ key: k, value: DEFAULT_REFERRAL_SETTINGS[k] })));
        return db.select().from(settings).where(inArray(settings.key, REFERRAL_SETTINGS_KEYS));
    }

    return all;
}

export async function updateReferralSettings(updates: { key: string; value: string }[]) {
    await requireAdminSession();

    for (const update of updates) {
        await db.insert(settings)
            .values({ key: update.key, value: update.value })
            .onDuplicateKeyUpdate({ set: { value: update.value, updatedAt: new Date() } });
    }

    await db.insert(adminNotifications).values({
        type: "admin_updated_referrals",
        message: `Admin actualizó la configuración del módulo de Referidos`,
        isRead: false
    });

    revalidatePath("/admin/referrals");
    revalidatePath("/admin");
    return { success: true };
}

// ============================================
// HISTORIAL Y AUDITORÍA
// ============================================

const referrerClients = aliasedTable(clients, "referrer_clients");
const referredClients = aliasedTable(clients, "referred_clients");

export async function getReferralHistory() {
    await requireAdminSession();
    return db
        .select({
            id: referralHistory.id,
            pointsReferrer: referralHistory.pointsReferrer,
            pointsReferred: referralHistory.pointsReferred,
            createdAt: referralHistory.createdAt,
            referrerName: referrerClients.username,
            referredName: referredClients.username,
        })
        .from(referralHistory)
        .leftJoin(referrerClients, eq(referralHistory.referrerId, referrerClients.id))
        .leftJoin(referredClients, eq(referralHistory.referredId, referredClients.id))
        .orderBy(desc(referralHistory.createdAt));
}
