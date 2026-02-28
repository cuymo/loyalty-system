"use client";

import { Area, AreaChart, CartesianGrid, XAxis, Bar, BarChart } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

interface ChartDataPoint {
    date: string;
    clientes: number;
    canjes: number;
}

const clientChartConfig = {
    clientes: {
        label: "Nuevos Clientes",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

const redemptionChartConfig = {
    canjes: {
        label: "Canjes Aprobados",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

export function DashboardCharts({ data }: { data: ChartDataPoint[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Nuevos Clientes - Area Chart */}
            <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold leading-none tracking-tight text-foreground">
                        Nuevos Clientes
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1.5">
                        Registros en los últimos 7 días
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                    <ChartContainer config={clientChartConfig} className="h-[250px] w-full">
                        <AreaChart
                            accessibilityLayer
                            data={data}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" className="bg-popover text-popover-foreground shadow-xl rounded-lg border-border" />}
                            />
                            <defs>
                                <linearGradient id="fillClientes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-clientes)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-clientes)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <Area
                                dataKey="clientes"
                                type="natural"
                                fill="url(#fillClientes)"
                                fillOpacity={0.4}
                                stroke="var(--color-clientes)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Canjes de Premios - Bar Chart */}
            <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold leading-none tracking-tight text-foreground">
                        Canjes de Premios
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1.5">
                        Premios reclamados en los últimos 7 días
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                    <ChartContainer config={redemptionChartConfig} className="h-[250px] w-full">
                        <BarChart
                            accessibilityLayer
                            data={data}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent className="bg-popover text-popover-foreground shadow-xl rounded-lg border-border" />}
                            />
                            <Bar
                                dataKey="canjes"
                                fill="var(--color-canjes)"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
