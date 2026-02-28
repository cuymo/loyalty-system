"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { rewards, clients, appNotifications, adminNotifications, redemptions } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { triggerWebhook } from "@/lib/webhook";

export async function createReward(data: {
    name: string;
    description?: string;
    imageUrl?: string[];
    pointsRequired: number;
    requiredTier?: "none" | "bronze" | "silver" | "gold" | "vip";
    type: "discount" | "product" | "credit";
    status?: "active" | "inactive" | "out_of_stock";
    stock?: number | null;
}) {
    await requireAdminSession();

    const [inserted] = await db.insert(rewards).values({
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || [],
        pointsRequired: data.pointsRequired,
        requiredTier: data.requiredTier || "none",
        type: data.type,
        status: data.status || "active",
        stock: data.stock,
    }).returning();

    revalidatePath("/admin/rewards");
    revalidatePath("/admin");

    await triggerWebhook("admin.premio_creado", {
        rewardId: inserted.id,
        name: data.name,
        description: data.description || null,
        pointsRequired: data.pointsRequired,
        type: data.type,
        status: data.status || "active"
    });

    await db.insert(adminNotifications).values({
        type: "admin_created_reward",
        message: `Admin creó premio: ${data.name} (${data.pointsRequired} pts)`,
        isRead: false
    });

    if (data.status === "active") {
        // --- SISTEMA DE NOTIFICACIONES ---
        const allClients = await db.select().from(clients).where(isNull(clients.deletedAt));

        const attainableClients: { id: number; phone: string; username: string; points: number }[] = [];
        const aspirationalClients: { id: number; phone: string; username: string; points: number }[] = [];
        const inAppNotifications: { clientId: number; rewardId: number; title: string; body: string; type: "reward_available" | "new_reward"; isRead: boolean; imageUrl: string[] }[] = [];

        for (const client of allClients) {
            const canAfford = client.points >= data.pointsRequired;

            if (client.wantsTransactional) {
                if (canAfford) {
                    attainableClients.push(client);
                } else {
                    aspirationalClients.push(client);
                }
            }

            if (client.wantsSecurity) { // fallback
                const title = canAfford ? "¡Premio Disponible!" : "Nuevo Premio Agregado";
                const body = canAfford
                    ? `Tienes los puntos necesarios para canjear: ${data.name}`
                    : `Sigue acumulando puntos para ganar: ${data.name} (cuesta ${data.pointsRequired} pts)`;
                const type = canAfford ? "reward_available" : "new_reward";

                inAppNotifications.push({
                    clientId: client.id,
                    rewardId: inserted.id,
                    title,
                    body,
                    type,
                    isRead: false,
                    imageUrl: data.imageUrl || [],
                });
            }
        }

        if (inAppNotifications.length > 0) {
            await db.insert(appNotifications).values(inAppNotifications);
        }

        if (attainableClients.length > 0 || aspirationalClients.length > 0) {
            await triggerWebhook("admin.notificacion_masiva_premios", {
                rewardId: inserted.id,
                rewardName: data.name,
                pointsRequired: data.pointsRequired,
                attainableClients,
                aspirationalClients
            });
        }
    }
}

export async function updateReward(
    id: number,
    data: {
        name?: string;
        description?: string;
        imageUrl?: string[];
        pointsRequired?: number;
        requiredTier?: "none" | "bronze" | "silver" | "gold" | "vip";
        type?: "discount" | "product" | "credit";
        status?: "active" | "inactive" | "out_of_stock";
        stock?: number | null;
    }
) {
    await requireAdminSession();
    await db.update(rewards).set({
        ...data,
        updatedAt: new Date(),
    }).where(eq(rewards.id, id));

    if (data.status === "inactive") {
        await db.delete(appNotifications).where(eq(appNotifications.rewardId, id));
    }

    await triggerWebhook("admin.premio_modificado", {
        rewardId: id,
        updates: data
    });

    await db.insert(adminNotifications).values({
        type: "admin_updated_reward",
        message: `Admin modificó el premio #${id}${data.name ? ` (${data.name})` : ""}`,
        isRead: false
    });

    revalidatePath("/admin/rewards");
    revalidatePath("/admin");
}

export async function deleteReward(id: number) {
    await requireAdminSession();

    const usage = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.rewardId, id));

    if (usage.length > 0) {
        return {
            success: false,
            error: "No se puede eliminar porque ya tiene canjes registrados. Cámbialo a inactivo u out_of_stock.",
        };
    }

    await db.delete(appNotifications).where(eq(appNotifications.rewardId, id));
    await db.delete(rewards).where(eq(rewards.id, id));

    await db.insert(adminNotifications).values({
        type: "admin_deleted_reward",
        message: `Admin eliminó el premio #${id}`,
        isRead: false
    });

    revalidatePath("/admin/rewards");
    revalidatePath("/admin");
    return { success: true };
}

export async function getRewards() {
    await requireAdminSession();
    // Use desc ordering
    return await db.select().from(rewards).orderBy(rewards.id); // For now keep same order as table
}
