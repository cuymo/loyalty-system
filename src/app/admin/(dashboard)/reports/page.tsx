/**
 * admin/reports/page.tsx
 * Descripcion: Pagina de Reportes con metricas y estadisticas — Shadcn UI v4
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
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
import { BarChart3, Users, Gift, QrCode, Ticket } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

    // Get reward names for top rewards
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

    const metrics = [
        { label: "Total Clientes", value: data.totalClients, icon: Users },
        { label: "Codigos Generados", value: data.totalCodes, icon: QrCode },
        {
            label: "Tasa de Uso",
            value: `${data.codeUsageRate}%`,
            icon: BarChart3,
        },
        {
            label: "Canjes Aprobados",
            value: data.approvedRedemptions,
            icon: Ticket,
        },
    ];

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Reportes</h1>
                <p className="text-muted-foreground mt-1">
                    Metricas y estadisticas de la plataforma
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.label}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardDescription>{metric.label}</CardDescription>
                                <metric.icon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-3xl">
                                {metric.value}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Tabs for Detail Sections */}
            <Tabs defaultValue="codigos">
                <TabsList>
                    <TabsTrigger value="codigos">
                        <QrCode className="size-4" />
                        Codigos
                    </TabsTrigger>
                    <TabsTrigger value="canjes">
                        <Ticket className="size-4" />
                        Canjes
                    </TabsTrigger>
                    <TabsTrigger value="premios">
                        <Gift className="size-4" />
                        Top Premios
                    </TabsTrigger>
                </TabsList>

                {/* Codes Breakdown */}
                <TabsContent value="codigos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Desglose de Codigos</CardTitle>
                            <CardDescription>
                                {data.codeUsageRate}% utilizados
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Total Generados
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">
                                                {data.totalCodes}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Usados
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="default">
                                                {data.usedCodes}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Disponibles
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline">
                                                {data.totalCodes - data.usedCodes}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Progreso de uso</span>
                                    <span>{data.codeUsageRate}%</span>
                                </div>
                                <Progress value={data.codeUsageRate} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Redemptions */}
                <TabsContent value="canjes">
                    <Card>
                        <CardHeader>
                            <CardTitle>Canjes</CardTitle>
                            <CardDescription>
                                Resumen de solicitudes y aprobaciones
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Total Solicitudes
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary">
                                                {data.totalRedemptions}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Aprobados
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="default">
                                                {data.approvedRedemptions}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Puntos Canjeados
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline">
                                                {data.totalPointsRedeemed} pts
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Top Rewards */}
                <TabsContent value="premios">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Gift className="w-5 h-5 text-primary" />
                                <CardTitle>Premios Mas Canjeados</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.topRewards.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    No hay datos de canjes aun
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Premio</TableHead>
                                            <TableHead className="text-right">
                                                Canjes
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.topRewards.map((reward, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono text-muted-foreground">
                                                    #{index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {reward.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary">
                                                        {reward.count}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
