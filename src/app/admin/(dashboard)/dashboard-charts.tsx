"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

interface ChartDataPoint {
    date: string;
    clientes: number;
    canjes: number;
}

export function DashboardCharts({ data }: { data: ChartDataPoint[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">Nuevos Clientes</h3>
                    <p className="text-sm text-muted-foreground">Crecimiento de registros en los últimos 7 días</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorClient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                            <Area type="monotone" dataKey="clientes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClient)" name="Nuevos Clientes" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">Canjes de Premios</h3>
                    <p className="text-sm text-muted-foreground">Volumen de premios reclamados en los últimos 7 días</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} allowDecimals={false} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }} />
                            <Bar dataKey="canjes" fill="#22c55e" radius={[4, 4, 0, 0]} name="Premios Canjeados" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
