/**
ID: page_0008
Panel de control administrativo principal con métricas consolidadas, gráficos de actividad y accesos directos de gestión.
*/

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardMetrics, getDashboardChartData } from "@/features/dashboard/actions";
import Link from "next/link";
import {
    Users,
    Gift,
    QrCode,
    BarChart3,
    TrendingUp,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import {
    Card,
    CardContent,
    CardHeader,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const metrics = await getDashboardMetrics();
    const chartData = await getDashboardChartData();

    // Reducido a 4 métricas principales para respetar el grid lg:grid-cols-4 de la guía UI
    const METRIC_CARDS = [
        {
            label: "Clientes",
            key: "clients" as const,
            description: "Total registrados",
            icon: Users,
            href: "/admin/clients",
        },
        {
            label: "Premios",
            key: "rewards" as const,
            description: "Premios activos",
            icon: Gift,
            href: "/admin/rewards",
        },
        {
            label: "Códigos",
            key: "codes" as const,
            description: "Códigos generados",
            icon: QrCode,
            href: "/admin/codes",
        },
        {
            label: "Canjes Aprobados",
            key: "redemptions" as const,
            description: "Solicitudes exitosas",
            icon: BarChart3,
            href: "/admin/reports",
        },
    ];

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header de la Página */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Bienvenido, {(session.user as any)?.firstName} {(session.user as any)?.lastName}
                    </h1>
                    <p className="text-muted-foreground">
                        Aquí tienes un resumen de tu negocio.
                    </p>
                </div>
                <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 font-medium border-border/50 bg-background shadow-xs py-1">
                    <TrendingUp size={14} className="text-primary" />
                    En vivo
                </Badge>
            </div>

            {/* Metric Cards - Siguiendo estrictamente grid grid-cols-2 lg:grid-cols-4 */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {METRIC_CARDS.map((card) => (
                    <Link key={card.label} href={card.href} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-border/50 shadow-sm h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardDescription className="text-sm font-medium">
                                    {card.label}
                                </CardDescription>
                                <card.icon size={16} className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{metrics[card.key]?.toLocaleString() || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Charts */}
            <DashboardCharts data={chartData} />
        </div>
    );
}
