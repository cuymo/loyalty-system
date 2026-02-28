"use server";

import { db } from "@/db";
import { clients, codes, adminNotifications } from "@/db/schema";
import { eq, and, notLike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { triggerWebhook } from "@/lib/webhook";
import { randomBytes } from "crypto";

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

