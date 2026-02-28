/**
 * actions/admin/index.ts
 * Descripcion: Server Actions para todas las operaciones CRUD del administrador
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-21
 * Descripcion de la modificacion: Implementacion completa de CRUD para premios, campanas, codigos, clientes y ajustes
 */

"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
    rewards,
    codes,
    clients,
    webhookEvents,
    redemptions,
    admins,
    nameChangesHistory,
} from "@/db/schema";
import { eq, sql, and, like, notLike, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { triggerWebhook } from "@/lib/webhook";
import { appNotifications, adminNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";

// ============================================
// PREMIOS
// ============================================

export async function createReward(data: {
    name: string;
    description?: string;
    imageUrl?: string[];
    pointsRequired: number;
    requiredTier?: "none" | "bronze" | "silver" | "gold" | "vip";
    type: "discount" | "product" | "credit";
    status?: "active" | "inactive" | "out_of_stock";
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
    }).returning({ id: rewards.id });
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
        // 1. Obtener todos los clientes
        const allClients = await db.select().from(clients);

        const attainableClients: { id: number; phone: string; username: string; points: number }[] = [];
        const aspirationalClients: { id: number; phone: string; username: string; points: number }[] = [];

        const inAppNotifications: { clientId: number; rewardId: number; title: string; body: string; type: "campaign_only_text" | "campaign_with_image" | "campaign_with_points" | "reward_available" | "new_reward" | "points_earned" | "points_spent"; isRead: boolean }[] = [];
        const targetClientIds: number[] = [];

        for (const client of allClients) {
            const canAfford = client.points >= data.pointsRequired;

            // Grupos para Webhook (WhatsApp en n8n)
            if (client.wantsTransactional) {
                if (canAfford) {
                    attainableClients.push({
                        id: client.id,
                        phone: client.phone,
                        username: client.username,
                        points: client.points,
                    });
                } else {
                    aspirationalClients.push({
                        id: client.id,
                        phone: client.phone,
                        username: client.username,
                        points: client.points,
                    });
                }
            }

            // Datos para Notificaciones In-App y Push
            if (client.wantsMarketing) {
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
                });

                targetClientIds.push(client.id);
            }
        }

        // 2. Insertar historial In-App
        if (inAppNotifications.length > 0) {
            await db.insert(appNotifications).values(inAppNotifications);
        }

        // 3. Disparar Webhook de n8n para WhatsApp MASIVO
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
    }
) {
    await requireAdminSession();
    await db.update(rewards).set(data).where(eq(rewards.id, id));

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
    // 1. Verificar si hay canjes para este premio
    const usage = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.rewardId, id));

    if (usage.length > 0) {
        return {
            success: false,
            error: "No se puede eliminar porque ya tiene canjes registrados. Cámbialo a inactivo.",
        };
    }

    // 2. Eliminar notificaciones huérfanas
    await db.delete(appNotifications).where(eq(appNotifications.rewardId, id));

    // 3. Eliminar el premio
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
    return db.select().from(rewards).orderBy(rewards.createdAt);
}

// ============================================
// CODIGOS
// ============================================

export async function generateCodes(data: {
    prefix: string;
    quantity: number;
    expirationDate: string;
    codeLength: number;
    batchName: string;
    pointsValue: number;
}) {
    await requireAdminSession();
    const generatedCodes = [];
    const expDate = new Date(data.expirationDate);

    for (let i = 0; i < data.quantity; i++) {
        const randomPart = randomBytes(data.codeLength)
            .toString("hex")
            .slice(0, data.codeLength)
            .toUpperCase();
        const code = `${data.prefix}${randomPart}`;

        generatedCodes.push({
            code,
            expirationDate: expDate,
            batchName: data.batchName,
            pointsValue: data.pointsValue,
            status: "unused" as const,
        });
    }

    await db.insert(codes).values(generatedCodes);
    revalidatePath("/admin/codes");
    revalidatePath("/admin");

    await triggerWebhook("admin.lote_codigos_generado", {
        batchName: data.batchName,
        quantity: data.quantity,
        expirationDate: data.expirationDate,
        pointsValue: data.pointsValue,
        prefix: data.prefix,
        codeLength: data.codeLength
    });

    await db.insert(adminNotifications).values({
        type: "admin_generated_codes",
        message: `Admin generó lote de códigos: ${data.batchName} (${data.quantity} un.)`,
        isRead: false
    });

    return generatedCodes.length;
}

export async function deleteBatch(batchName: string) {
    await requireAdminSession();
    // 1. Verificar si tiene códigos sin usar
    const unusedCodes = await db
        .select()
        .from(codes)
        .where(
            and(
                eq(codes.batchName, batchName),
                eq(codes.status, "unused")
            )
        );

    let count = 0;

    if (unusedCodes.length > 0) {
        // Solo borramos codigos no utilizados para no romper el historial de puntos de clientes
        await db
            .delete(codes)
            .where(
                and(
                    eq(codes.batchName, batchName),
                    eq(codes.status, "unused")
                )
            );
        count = unusedCodes.length;
    } else {
        // Si el lote ya está agotado (no tiene códigos sin usar),
        // lo archivamos para ocultarlo completamente de la interfaz, conservando el historial.
        await db
            .update(codes)
            .set({ batchName: `_ARCHIVED_${batchName}` })
            .where(eq(codes.batchName, batchName));
        count = 1; // Indicador de éxito
    }

    await db.insert(adminNotifications).values({
        type: "admin_deleted_batch",
        message: `Admin eliminó/archivó lote de códigos: ${batchName}`,
        isRead: false
    });

    revalidatePath("/admin/codes");
    revalidatePath("/admin");
    return count;
}

export async function getCodes(batchName?: string) {
    await requireAdminSession();
    const baseQuery = db
        .select({
            id: codes.id,
            code: codes.code,
            status: codes.status,
            pointsValue: codes.pointsValue,
            batchName: codes.batchName,
            expirationDate: codes.expirationDate,
            createdAt: codes.createdAt,
            usedAt: codes.usedAt,
            usedBy: codes.usedBy,
            usedByUsername: clients.username,
            usedByPhone: clients.phone,
        })
        .from(codes)
        .leftJoin(clients, eq(codes.usedBy, clients.id));

    if (batchName) {
        return baseQuery
            .where(eq(codes.batchName, batchName))
            .orderBy(codes.createdAt);
    }
    return baseQuery
        .where(notLike(codes.batchName, "_ARCHIVED_%"))
        .orderBy(codes.createdAt);
}

export async function getCodeBatches() {
    await requireAdminSession();
    return db
        .select({
            batchName: codes.batchName,
            count: sql<number>`count(*)`.as("count"),
            usedCount: sql<number>`sum(case when ${codes.status} = 'used' then 1 else 0 end)`.as("usedCount"),
        })
        .from(codes)
        .where(notLike(codes.batchName, "_ARCHIVED_%"))
        .groupBy(codes.batchName);
}

// ============================================
// CLIENTES
// ============================================

export async function getClients() {
    await requireAdminSession();
    return db.select().from(clients).where(isNull(clients.deletedAt)).orderBy(clients.createdAt);
}

export async function getClientById(id: number) {
    await requireAdminSession();
    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id))
        .limit(1);
    return client || null;
}

export async function deleteClient(id: number) {
    await requireAdminSession();

    // 1. Eliminar notificaciones in-app
    await db.delete(appNotifications).where(eq(appNotifications.clientId, id));

    // 2. Eliminar historial de cambios de nombre
    await db.delete(nameChangesHistory).where(eq(nameChangesHistory.clientId, id));

    // 3. Eliminar historial de canjes
    await db.delete(redemptions).where(eq(redemptions.clientId, id));

    // 4. Desvincular codigos escaneados (dejarlos huerfanos para no afectar estadisticas)
    await db.update(codes).set({ usedBy: null }).where(eq(codes.usedBy, id));

    // 5. Finalmente, eliminar el cliente
    await db.delete(clients).where(eq(clients.id, id));

    await db.insert(adminNotifications).values({
        type: "admin_deleted_client",
        message: `Admin eliminó al cliente #${id}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
}

export async function blockClient(id: number, reason: string) {
    await requireAdminSession();
    await db.update(clients).set({
        isBlocked: true,
        blockReason: reason
    }).where(eq(clients.id, id));

    await db.insert(adminNotifications).values({
        type: "admin_blocked_client",
        message: `Admin bloqueó al cliente #${id}. Motivo: ${reason}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
}

export async function unblockClient(id: number) {
    await requireAdminSession();
    await db.update(clients).set({
        isBlocked: false,
        blockReason: null
    }).where(eq(clients.id, id));

    await db.insert(adminNotifications).values({
        type: "admin_unblocked_client",
        message: `Admin desbloqueó al cliente #${id}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
}

export async function searchRedemptionTicket(query: string) {
    await requireAdminSession();
    // Buscar por UUID o por telefono
    const byUuid = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.ticketUuid, query));

    if (byUuid.length > 0) return byUuid;

    // Buscar por telefono del cliente
    const clientResults = await db
        .select()
        .from(clients)
        .where(like(clients.phone, `%${query}%`));

    if (clientResults.length > 0) {
        const clientIds = clientResults.map((c) => c.id);
        const results = [];
        for (const cId of clientIds) {
            const r = await db
                .select()
                .from(redemptions)
                .where(eq(redemptions.clientId, cId));
            results.push(...r);
        }
        return results;
    }

    return [];
}

export async function getClientMovements(clientId: number) {
    await requireAdminSession();
    // 1. Used codes (points earned)
    const usedCodes = await db
        .select()
        .from(codes)
        .where(and(eq(codes.usedBy, clientId), eq(codes.status, "used")));

    // 2. Redemptions (points spent)
    const clientRedemptions = await db
        .select({
            redemption: redemptions,
            rewardName: rewards.name,
        })
        .from(redemptions)
        .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
        .where(eq(redemptions.clientId, clientId));

    // 3. Name changes history
    const nameChanges = await db
        .select()
        .from(nameChangesHistory)
        .where(eq(nameChangesHistory.clientId, clientId));

    // Format into unified timeline
    const movements = [
        ...usedCodes.map((c) => ({
            id: `code-${c.id}`,
            type: "code" as const,
            points: c.pointsValue,
            date: c.usedAt || c.createdAt,
            details: `Codigo escaneado: ${c.code}`,
        })),
        ...clientRedemptions.map((r) => ({
            id: `redemption-${r.redemption.id}`,
            type: "redemption" as const,
            points: -r.redemption.pointsSpent,
            date: r.redemption.createdAt,
            details: `Premio canjeado: ${r.rewardName || "Desconocido"}`,
            status: r.redemption.status,
        })),
        ...nameChanges.map((nc) => ({
            id: `namechange-${nc.id}`,
            type: "name_change" as const,
            points: 0,
            date: nc.createdAt,
            details: `Cambio de nombre: ${nc.oldNames.join(' → ')} ➔ ${nc.newName}`,
        })),
    ];

    // Sort by date descending
    return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ============================================
// AJUSTES (V2 MOCKED - tabla settings eliminada en migración PG)
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

    await db.execute(sql`TRUNCATE TABLE app_notifications CASCADE`);
    await db.execute(sql`TRUNCATE TABLE redemptions CASCADE`);
    await db.execute(sql`TRUNCATE TABLE name_changes_history CASCADE`);
    await db.execute(sql`TRUNCATE TABLE codes CASCADE`);
    await db.execute(sql`TRUNCATE TABLE rewards CASCADE`);
    await db.execute(sql`TRUNCATE TABLE clients CASCADE`);

    await triggerWebhook("sistema.danger_zone_activada", {
        timestamp: new Date().toISOString(),
        action: "Toda la base de datos de usuarios y registros ha sido purgada."
    });

    await db.insert(adminNotifications).values({
        type: "danger_zone",
        message: `¡ALERTA MÁXIMA! Admin ejecutó borrado total (Danger Zone)`,
        isRead: false
    });

    revalidatePath("/admin");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/rewards");
    revalidatePath("/admin/codes");
    revalidatePath("/admin/reports");
}

// ============================================
// INTEGRACIONES (WEBHOOKS)
// ============================================

export async function getWebhookEvents() {
    await requireAdminSession();
    return db.select().from(webhookEvents).orderBy(webhookEvents.eventName);
}

export async function updateWebhookEvent(
    id: number,
    data: { webhookUrl?: string; isActive?: boolean }
) {
    await requireAdminSession();
    await db.update(webhookEvents).set(data).where(eq(webhookEvents.id, id));
    revalidatePath("/admin/integrations");
}

// ============================================
// NOTIFICACIONES MANUALES (ADMIN)
// ============================================

export async function sendCustomNotification(
    targetIds: number[] | 'all',
    data: {
        title: string;
        body: string;
        imageUrl?: string;
        sendToApp: boolean;
        sendToWhatsapp: boolean;
    }
) {
    await requireAdminSession();
    let clientsList;
    if (targetIds === 'all') {
        clientsList = await db.select().from(clients).where(isNull(clients.deletedAt));
    } else {
        clientsList = await db.select().from(clients).where(and(inArray(clients.id, targetIds), isNull(clients.deletedAt)));
    }

    if (clientsList.length === 0) return { success: false, error: "No hay clientes seleccionados" };

    if (data.sendToApp) {
        const inAppNotifs = clientsList
            .map(c => ({
                clientId: c.id,
                title: data.title,
                body: data.body,
                type: "campaign_only_text" as const,
                isRead: false
            }));

        if (inAppNotifs.length > 0) {
            await db.insert(appNotifications).values(inAppNotifs);
        }
    }

    if (data.sendToWhatsapp) {
        const whatsappTargets = clientsList
            .filter(c => c.wantsMarketing)
            .map(c => ({
                id: c.id,
                phone: c.phone,
                username: c.username,
                points: c.points
            }));

        if (whatsappTargets.length > 0) {
            await triggerWebhook("admin.notificacion_custom_whatsapp", {
                title: data.title,
                body: data.body,
                imageUrl: data.imageUrl || null,
                targets: whatsappTargets
            });
        }
    }

    return { success: true };
}

// ============================================
// CANJES (Aprobar / Rechazar)
// ============================================

export async function getPendingRedemptions() {
    await requireAdminSession();
    return db
        .select({
            id: redemptions.id,
            ticketUuid: redemptions.ticketUuid,
            pointsSpent: redemptions.pointsSpent,
            status: redemptions.status,
            createdAt: redemptions.createdAt,
            clientName: clients.username,
            clientPhone: clients.phone,
            clientAvatar: clients.avatarSvg,
            rewardName: rewards.name,
            rewardImage: rewards.imageUrl,
        })
        .from(redemptions)
        .leftJoin(clients, eq(redemptions.clientId, clients.id))
        .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
        .where(eq(redemptions.status, "pending"))
        .orderBy(desc(redemptions.createdAt));
}

export async function approveRedemption(redemptionId: number) {
    await requireAdminSession();
    const [redemption] = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.id, redemptionId))
        .limit(1);

    if (!redemption) return;

    await db
        .update(redemptions)
        .set({ status: "approved" })
        .where(eq(redemptions.id, redemptionId));

    // Get client and reward info for webhook
    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, redemption.clientId))
        .limit(1);

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, redemption.rewardId))
        .limit(1);

    // Siempre In-App
    if (client) {
        await db.insert(appNotifications).values({
            clientId: client.id,
            title: "¡Canje Aprobado!",
            body: `Tu solicitud de canje por "${reward?.name || 'Desconocido'}" ha sido aprobada. ¡Disfrútalo!`,
            isRead: false,
            type: "points_spent"
        });

        // Opcional por WhatsApp
        if (client.wantsTransactional) {
            await triggerWebhook("cliente.canje_exitoso", {
                ticketUuid: redemption.ticketUuid,
                clientId: redemption.clientId,
                username: client.username || "Desconocido",
                phone: client.phone || "",
                rewardId: redemption.rewardId,
                rewardName: reward?.name || "Desconocido",
                pointsSpent: redemption.pointsSpent,
                status: "approved"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "admin_approved_redemption",
        message: `Admin Aprobó canje de ${client?.username || "Desconocido"} por ${reward?.name || "Desconocido"}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
}

export async function rejectRedemption(redemptionId: number, reason?: string) {
    await requireAdminSession();
    const [redemption] = await db
        .select()
        .from(redemptions)
        .where(eq(redemptions.id, redemptionId))
        .limit(1);

    if (!redemption) return;

    await db
        .update(redemptions)
        .set({ status: "rejected" })
        .where(eq(redemptions.id, redemptionId));

    // Refund points to client Atomically
    // (Aun leemos el cliente inicialmente para el triggerWebhook)
    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, redemption.clientId))
        .limit(1);

    if (client) {
        await db
            .update(clients)
            .set({ points: sql`${clients.points} + ${redemption.pointsSpent}` })
            .where(eq(clients.id, redemption.clientId));
    }

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, redemption.rewardId))
        .limit(1);

    // Siempre In-App
    if (client) {
        await db.insert(appNotifications).values({
            clientId: client.id,
            title: "Canje Rechazado",
            body: `Tu solicitud de canje por "${reward?.name || 'Desconocido'}" fue rechazada. Motivo: ${reason || 'Contacta soporte'}. Tus puntos (${redemption.pointsSpent}) han sido devueltos.`,
            isRead: false,
            type: "points_earned"
        });

        // Opcional por WhatsApp
        if (client.wantsTransactional) {
            await triggerWebhook("cliente.canje_rechazado", {
                ticketUuid: redemption.ticketUuid,
                clientId: redemption.clientId,
                username: client.username || "Desconocido",
                phone: client.phone || "",
                rewardId: redemption.rewardId,
                rewardName: reward?.name || "Desconocido",
                pointsSpent: redemption.pointsSpent,
                reason: reason || "Rechazado por el administrador",
                status: "rejected"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "admin_rejected_redemption",
        message: `Admin Rechazó canje de ${client?.username || "Desconocido"} por ${reward?.name || "Desconocido"}. Motivo: ${reason || "N/A"}`,
        isRead: false
    });

    revalidatePath("/admin/clients");
    revalidatePath("/admin");
}

// ============================================
// PERFIL DE USUARIO
// ============================================

export async function updateAdminProfile(
    adminId: number,
    data: { name: string; firstName?: string; lastName?: string; email: string; password?: string }
) {
    await requireAdminSession();
    const updateData: any = {
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
    };

    if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await db
        .update(admins)
        .set(updateData)
        .where(eq(admins.id, adminId));

    revalidatePath("/admin");
    revalidatePath("/admin/profile");
}

export async function getAdminProfile(id: number) {
    await requireAdminSession();
    const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, id))
        .limit(1);
    return admin || null;
}

// ============================================
// NOTIFICACIONES IN-APP ADMIN (PERSISTENTES)
// ============================================

export async function getAdminNotifications() {
    await requireAdminSession();
    return db
        .select()
        .from(adminNotifications)
        .where(inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"]))
        .orderBy(desc(adminNotifications.createdAt))
        .limit(20);
}

export async function getAdminUnreadCount() {
    await requireAdminSession();
    const unread = await db
        .select()
        .from(adminNotifications)
        .where(
            and(
                eq(adminNotifications.isRead, false),
                inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"])
            )
        );
    return unread.length;
}

export async function markAdminNotificationsAsRead() {
    await requireAdminSession();
    await db
        .update(adminNotifications)
        .set({ isRead: true })
        .where(
            and(
                eq(adminNotifications.isRead, false),
                inArray(adminNotifications.type, ["new_client", "new_redemption", "points_added"])
            )
        );
    return { success: true };
}
