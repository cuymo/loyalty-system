"use server";

import { db } from "@/db";
import { clients, codes, redemptions, adminNotifications, appNotifications } from "@/db/schema";
import { eq, sql, inArray, isNull, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { triggerWebhook } from "@/lib/webhook";

/**
 * Obtiene todos los clientes con métricas agregadas (visitas totales, última visita, canjes).
 * Se utiliza una sola consulta con LEFT JOINs y funciones GROUP BY para EVITAR el problema N+1.
 */
export async function getCrmClients() {
    // Usamos SQL puro para las agregaciones complejas que Drizzle no mapea directamente (ej. COUNT DISTINCT)
    const result = await db
        .select({
            id: clients.id,
            username: clients.username,
            phone: clients.phone,
            avatarSvg: clients.avatarSvg,
            points: clients.points,
            wantsMarketing: clients.wantsMarketing,
            wantsTransactional: clients.wantsTransactional,
            wantsInAppNotifs: clients.wantsInAppNotifs,
            createdAt: clients.createdAt,
            lifetimePoints: clients.lifetimePoints,
            referralCount: clients.referralCount,
            birthDate: clients.birthDate,
            totalVisits: sql<number>`(SELECT COUNT(*) FROM ${codes} WHERE ${codes.usedByClientId} = clients.id)`.mapWith(Number),
            lastVisit: sql<string | null>`(SELECT MAX(${codes.usedAt}) FROM ${codes} WHERE ${codes.usedByClientId} = clients.id)`,
            totalRedemptions: sql<number>`(SELECT COUNT(*) FROM ${redemptions} WHERE ${redemptions.clientId} = clients.id)`.mapWith(Number),
        })
        .from(clients)
        .where(isNull(clients.deletedAt));

    return result;
}

/**
 * Ejecuta una campaña CRM: Otorga puntos y envia mensajes.
 * Implementado dentro de una transacción de base de datos para garantizar la atomicidad (ACID).
 */
export async function processCrmCampaign(
    targetIds: number[] | 'all',
    data: {
        pointsToGift: number;
        sendMessage: boolean;
        title?: string;
        body?: string;
        imageUrl?: string;
    }
) {
    // TRANSACCIÓN DE BASE DE DATOS (ACID)
    // Si la operación de regalar puntos falla, o si el triggerWebhook lanza un error crítico,
    // se hace un rollback completo, evitando regalar puntos a unos sí y a otros no.
    return await db.transaction(async (tx) => {
        let clientsList;
        if (targetIds === 'all') {
            clientsList = await tx.select().from(clients).where(isNull(clients.deletedAt));
        } else {
            clientsList = await tx.select().from(clients).where(and(inArray(clients.id, targetIds), isNull(clients.deletedAt)));
        }

        if (clientsList.length === 0) {
            return { success: false, error: "No hay clientes válidos seleccionados." };
        }

        const ids = clientsList.map(c => c.id);

        // 1. Regalar Puntos Masivamente
        if (data.pointsToGift > 0) {
            // Actualización atómica de todos los clientes en una sola query
            await tx.execute(
                sql`UPDATE clients SET points = points + ${data.pointsToGift} WHERE id IN ${ids}`
            );

            // Registro de auditoría interno
            await tx.insert(adminNotifications).values({
                type: "points_gifted",
                message: `Campaña CRM: Se regalaron ${data.pointsToGift} pts a ${ids.length} clientes.`,
            });

            // Notificación in-app (si configuran)
            const inAppNotifs: { clientId: number; title: string; body: string; type: string; isRead: boolean }[] = clientsList
                .filter(c => c.wantsInAppNotifs)
                .map(c => ({
                    clientId: c.id,
                    title: "¡Regalo de Puntos!",
                    body: `Has recibido ${data.pointsToGift} puntos de regalo de Crew Zingy.`,
                    type: "points_gifted",
                    isRead: false
                }));

            if (inAppNotifs.length > 0) {
                await tx.insert(appNotifications).values(inAppNotifs);
            }
        }

        // 2. Enviar Mensaje (In-App y Webhook)
        if (data.sendMessage && data.title && data.body) {
            // A) Notificaciones In-App
            const inAppMessageNotifs: { clientId: number; title: string; body: string; type: string; isRead: boolean }[] = clientsList
                .filter(c => c.wantsInAppNotifs)
                .map(c => ({
                    clientId: c.id,
                    title: data.title as string,
                    body: data.body as string,
                    type: "system_message", // Opcionalmente usar type: "campaign" si tu enum lo permite, system_message es estándar
                    isRead: false
                }));

            if (inAppMessageNotifs.length > 0) {
                await tx.insert(appNotifications).values(inAppMessageNotifs);
            }

            // B) Webhook para WhatsApp
            const whatsappTargets = clientsList
                .filter(c => c.wantsMarketing)
                .map(c => ({
                    id: c.id,
                    phone: c.phone,
                    username: c.username,
                    points: c.points + (data.pointsToGift || 0) // Puntos calculados post-regalo
                }));

            if (whatsappTargets.length > 0) {
                // NOTA: triggerWebhook hace un throw si falla severamente la llamada (ej fetch reject)
                // lo cual abortará la transacción `tx` automáticamente y revocará la suma de puntos.
                await triggerWebhook("admin.notificacion_custom_whatsapp", {
                    title: data.title,
                    body: data.body,
                    imageUrl: data.imageUrl || null,
                    puntosRegalados: data.pointsToGift || 0, // Nuevo parámetro integrado para n8n
                    targets: whatsappTargets
                });
            }
        }

        // Refrescar vistas pertinentes
        revalidatePath("/admin/clients");
        revalidatePath("/admin/campaigns");

        return { success: true };
    });
}
