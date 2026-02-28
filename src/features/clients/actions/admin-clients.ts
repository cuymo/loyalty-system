"use server";

import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
    clients,
    appNotifications,
    nameChangesHistory,
    redemptions,
    codes,
    adminNotifications,
    pointTransactions
} from "@/db/schema";
import { eq, like, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

    // Obtener transacciones monetarias del Ledger (V2)
    const transactions = await db
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.clientId, clientId));

    // Obtener historial de cambiso de nombre
    const nameChanges = await db
        .select()
        .from(nameChangesHistory)
        .where(eq(nameChangesHistory.clientId, clientId));

    // Format into unified timeline
    const movements = [
        ...transactions.map((t) => ({
            id: `tx-${t.id}`,
            // Inferencia básica del type para compatibilidad con la UI actual
            type: t.reason === "redemption_in_reward" ? "redemption" as const : "code" as const,
            points: t.amount,
            date: t.createdAt,
            details: `Transacción: ${t.reason}`,
            status: "approved",
        })),
        ...nameChanges.map((nc) => ({
            id: `namechange-${nc.id}`,
            type: "name_change" as const,
            points: 0,
            date: nc.createdAt,
            details: `Cambio de nombre: ${nc.oldNames.join(", ")} ➔ ${nc.newName}`,
        })),
    ];

    // Sort by date descending
    return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
}
