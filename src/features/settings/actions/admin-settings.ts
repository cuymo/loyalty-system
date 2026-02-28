/**
 * actions/admin/settings.ts
 * Descripcion: Server Actions de Ajustes (mocked en V2) + Danger Zone
 * Fecha de creacion: 2026-02-28
 */
"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { triggerWebhook } from "@/lib/webhook";
import { adminNotifications } from "@/db/schema";

// ============================================
// AJUSTES REMOVED IN V2 - MOCKED FOR COMPATIBILITY
// ============================================

export async function getSettings() {
    await requireAdminSession();
    return [] as { key: string; value: string | null; createdAt?: Date; updatedAt?: Date }[];
}

export async function updateSetting(key: string, value: string) {
    await requireAdminSession();
    return { success: true };
}

export async function dangerZoneReset() {
    await requireAdminSession();

    // Deshabilitar chequeos de claves foráneas temporalmente
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);

    // Truncar para eliminar todo y resetear contadores AUTO_INCREMENT a 1
    await db.execute(sql`TRUNCATE TABLE app_notifications;`);
    await db.execute(sql`TRUNCATE TABLE redemptions;`);
    await db.execute(sql`TRUNCATE TABLE name_changes_history;`);
    await db.execute(sql`TRUNCATE TABLE codes;`);
    await db.execute(sql`TRUNCATE TABLE rewards;`);
    await db.execute(sql`TRUNCATE TABLE clients;`);

    // Rehabilitar chequeos de claves foráneas
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    await triggerWebhook("sistema.danger_zone_activada", {
        timestamp: new Date().toISOString(),
        action: "Toda la base de datos de usuarios y registros ha sido purgada y los IDs reseteados a 0."
    });

    await db.insert(adminNotifications).values({
        type: "danger_zone",
        message: `¡ALERTA MÁXIMA! Admin ejecutó borrado total y reseteo de contadores (Danger Zone)`,
        isRead: false
    });

    revalidatePath("/admin");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/rewards");
    revalidatePath("/admin/codes");
    revalidatePath("/admin/reports");
}
