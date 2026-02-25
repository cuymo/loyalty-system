/**
 * admin/page.tsx
 * Descripcion: Dashboard principal del panel de administracion con metricas en vivo
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-21
 * Descripcion de la modificacion: Rediseno con sidebar layout y metricas de BD
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { clients, rewards, codes, redemptions } from "@/db/schema";
import { count, eq, gte, and } from "drizzle-orm";
import Link from "next/link";
import {
    Users,
    Gift,
    QrCode,
    BarChart3,
    Settings,
    Plug,
    Ticket,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";

async function getChartData() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Generar array de los últimos 7 días
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
            dateStr: d.toISOString().split('T')[0], // YYYY-MM-DD
            date: d.toLocaleDateString("es-EC", { weekday: 'short', day: 'numeric' }),
            clientes: 0,
            canjes: 0,
        };
    });

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentClients = await db.select({
        createdAt: clients.createdAt
    }).from(clients).where(gte(clients.createdAt, sevenDaysAgo));

    const recentRedemptions = await db.select({
        createdAt: redemptions.createdAt
    }).from(redemptions).where(and(eq(redemptions.status, "approved"), gte(redemptions.createdAt, sevenDaysAgo)));

    const dict = last7Days.reduce((acc, current) => {
        acc[current.dateStr] = current;
        return acc;
    }, {} as Record<string, typeof last7Days[0]>);

    recentClients.forEach(c => {
        if (!c.createdAt) return;
        const d = new Date(c.createdAt).toISOString().split('T')[0];
        if (dict[d]) dict[d].clientes += 1;
    });

    recentRedemptions.forEach(c => {
        if (!c.createdAt) return;
        const d = new Date(c.createdAt).toISOString().split('T')[0];
        if (dict[d]) dict[d].canjes += 1;
    });

    return Object.values(dict);
}

async function getMetrics() {
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

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const metrics = await getMetrics();
    const chartData = await getChartData();

    const cards = [
        {
            label: "Clientes",
            value: metrics.clients,
            icon: Users,
            href: "/admin/clients",
        },
        {
            label: "Premios",
            value: metrics.rewards,
            icon: Gift,
            href: "/admin/rewards",
        },
        {
            label: "Códigos",
            value: metrics.codes,
            icon: QrCode,
            href: "/admin/codes",
        },
        {
            label: "Codigos Usados",
            value: metrics.usedCodes,
            icon: Ticket,
            href: "/admin/codes",
        },
        {
            label: "Canjes",
            value: metrics.redemptions,
            icon: BarChart3,
            href: "/admin/reports",
        },
    ];



    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Bienvenido, {session.user?.name}
                </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="group p-4 sm:p-5 bg-card border border-border rounded-xl flex flex-col justify-between hover:border-border/80 hover:shadow-md transition-all shadow-sm min-h-[100px]"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-4">
                            <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-tight">{card.label}</p>
                            <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </div>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{card.value}</p>
                    </Link>
                ))}
            </div>

            {/* Gráficos Recharts */}
            <DashboardCharts data={chartData} />

        </div>
    );
}
