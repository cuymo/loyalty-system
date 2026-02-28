"use server";

import { db } from "@/db";
import { clients, rewards, codes, redemptions } from "@/db/schema";
import { count, eq, gte, and } from "drizzle-orm";

/**
 * Obtiene las métricas generales del dashboard.
 */
export async function getDashboardMetrics() {
    const [clientCount] = await db.select({ value: count() }).from(clients);
    const [rewardCount] = await db.select({ value: count() }).from(rewards);
    const [codeCount] = await db.select({ value: count() }).from(codes);
    const [usedCodeCount] = await db
        .select({ value: count() })
        .from(codes)
        .where(eq(codes.status, "used"));
    const [redemptionCount] = await db
        .select({ value: count() })
        .from(redemptions);

    return {
        clients: clientCount?.value ?? 0,
        rewards: rewardCount?.value ?? 0,
        codes: codeCount?.value ?? 0,
        usedCodes: usedCodeCount?.value ?? 0,
        redemptions: redemptionCount?.value ?? 0,
    };
}

/**
 * Obtiene datos para los gráficos de actividad de los últimos 7 días.
 */
export async function getDashboardChartData() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toISOString().split("T")[0],
            date: d.toLocaleDateString("es-EC", {
                weekday: "short",
                day: "numeric",
            }),
            clientes: 0,
            canjes: 0,
        };
    });

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentClients = await db
        .select({ createdAt: clients.createdAt })
        .from(clients)
        .where(gte(clients.createdAt, sevenDaysAgo));

    const recentRedemptions = await db
        .select({ createdAt: redemptions.createdAt })
        .from(redemptions)
        .where(
            and(
                eq(redemptions.status, "approved"),
                gte(redemptions.createdAt, sevenDaysAgo)
            )
        );

    const dict = last7Days.reduce(
        (acc, current) => {
            acc[current.dateStr] = current;
            return acc;
        },
        {} as Record<string, (typeof last7Days)[0]>
    );

    recentClients.forEach((c) => {
        if (!c.createdAt) return;
        const d = new Date(c.createdAt).toISOString().split("T")[0];
        if (dict[d]) dict[d].clientes += 1;
    });

    recentRedemptions.forEach((c) => {
        if (!c.createdAt) return;
        const d = new Date(c.createdAt).toISOString().split("T")[0];
        if (dict[d]) dict[d].canjes += 1;
    });

    return Object.values(dict);
}
