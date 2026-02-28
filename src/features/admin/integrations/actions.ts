"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
ID: act_integrations_0001
Listado de todos los eventos de webhook disponibles en el sistema.
*/
export async function getWebhookEvents() {
    await requireAdminSession();
    return db.select().from(webhookEvents).orderBy(webhookEvents.eventName);
}

/**
ID: act_integrations_0002
Actualización del estado o URL de un evento de webhook específico.
*/
export async function updateWebhookEvent(
    id: number,
    data: { webhookUrl?: string; isActive?: boolean }
) {
    await requireAdminSession();
    await db.update(webhookEvents).set(data).where(eq(webhookEvents.id, id));
    revalidatePath("/admin/integrations");
}
