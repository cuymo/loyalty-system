/**
 * admin/reports/page.tsx
 * Descripcion: Pagina de Reportes — Server Component para data fetching
 * Refactorizado: 2026-02-28 — UI extraída a reports-client.tsx
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
    clients,
    rewards,
    codes,
    redemptions,
} from "@/db/schema";
import { count, eq, sql, sum } from "drizzle-orm";
import { ReportsClient } from "./reports-client";

async function getReportData() {
    const [totalClients] = await db.select({ value: count() }).from(clients);
    const [totalRewards] = await db.select({ value: count() }).from(rewards);
    const [totalCodes] = await db.select({ value: count() }).from(codes);
    const [usedCodes] = await db
        .select({ value: count() })
        .from(codes)
        .where(eq(codes.status, "used"));
    const [totalRedemptions] = await db
        .select({ value: count() })
        .from(redemptions);
    const [approvedRedemptions] = await db
        .select({ value: count() })
        .from(redemptions)
        .where(eq(redemptions.status, "approved"));
    const [totalPointsRedeemed] = await db
        .select({ value: sum(redemptions.pointsSpent) })
        .from(redemptions)
        .where(eq(redemptions.status, "approved"));

    // Top 5 rewards redeemed
    const topRewards = await db
        .select({
            rewardId: redemptions.rewardId,
            count: sql<number>`count(*)`.as("count"),
        })
        .from(redemptions)
        .groupBy(redemptions.rewardId)
        .orderBy(sql`count(*) DESC`)
        .limit(5);

    const topRewardsWithNames = [];
    for (const tr of topRewards) {
        const [reward] = await db
            .select()
            .from(rewards)
            .where(eq(rewards.id, tr.rewardId))
            .limit(1);
        topRewardsWithNames.push({
            name: reward?.name || `Premio #${tr.rewardId}`,
            count: tr.count,
        });
    }

    return {
        totalClients: totalClients?.value ?? 0,
        totalRewards: totalRewards?.value ?? 0,
        totalCodes: totalCodes?.value ?? 0,
        usedCodes: usedCodes?.value ?? 0,
        codeUsageRate: totalCodes?.value
            ? Math.round(((usedCodes?.value ?? 0) / totalCodes.value) * 100)
            : 0,
        totalRedemptions: totalRedemptions?.value ?? 0,
        approvedRedemptions: approvedRedemptions?.value ?? 0,
        totalPointsRedeemed: Number(totalPointsRedeemed?.value ?? 0),
        topRewards: topRewardsWithNames,
    };
}

export default async function ReportsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const data = await getReportData();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
                <p className="text-muted-foreground">
                    Metricas y estadisticas de la plataforma
                </p>
            </div>
            <ReportsClient data={data} />
        </div>
    );
}
