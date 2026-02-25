/**
 * (client)/home/page.tsx
 * Descripcion: Pagina de inicio del cliente con tarjeta de lealtad y puntos
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { getClientProfile, getMyRedemptions, getPublicSettings } from "@/actions/client";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Gift, QrCode, Ticket } from "lucide-react";

const getTierStyle = (tier: string) => {
    switch (tier) {
        case "bronze":
            return {
                card: "border-amber-500/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card hover:border-amber-500/50",
                blob: "bg-amber-500",
                text: "text-amber-600 dark:text-amber-500",
                progress: "bg-amber-500",
            };
        case "silver":
            return {
                card: "border-slate-400/40 dark:border-slate-400/30 bg-gradient-to-br from-slate-400/10 via-card to-card hover:border-slate-400/50",
                blob: "bg-slate-400",
                text: "text-slate-500 dark:text-slate-400",
                progress: "bg-slate-500 dark:bg-slate-400",
            };
        case "gold":
            return {
                card: "border-yellow-500/40 dark:border-yellow-500/30 bg-gradient-to-br from-yellow-500/15 via-card to-card hover:border-yellow-500/50",
                blob: "bg-yellow-500",
                text: "text-yellow-600 dark:text-yellow-500",
                progress: "bg-yellow-500",
            };
        case "vip":
            return {
                card: "border-purple-500/40 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-card to-card hover:border-purple-500/50",
                blob: "bg-purple-500",
                text: "text-purple-600 dark:text-purple-400",
                progress: "bg-purple-500",
            };
        case "none":
        default:
            return {
                card: "border-primary/20 dark:border-primary/20 bg-card hover:border-primary/40",
                blob: "bg-primary",
                text: "text-primary",
                progress: "bg-primary/90",
            };
    }
};

export default async function ClientHomePage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    const [redemptions, settings] = await Promise.all([
        getMyRedemptions(),
        getPublicSettings(),
    ]);
    const pendingRedemptions = redemptions.filter((r) => r.status === "pending");
    const notice = settings.notice_auth;

    const currentTier = client.vip?.currentTier || "none";
    const tierStyle = getTierStyle(currentTier as string);

    return (
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-6 animate-in fade-in duration-500">
            {/* Loyalty Card - Premium look */}
            <div className={`relative border shadow-sm rounded-3xl p-6 space-y-6 overflow-hidden group transition-all hover:shadow-md ${tierStyle.card}`}>
                <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700 ${tierStyle.blob}`} />
                    <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-700 delay-100 ${tierStyle.blob}`} />
                </div>

                <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-xs ring-2 ring-border/50">
                            <Image
                                src={`/avatars/${client.avatarSvg}`}
                                alt="Avatar"
                                width={56}
                                height={56}
                                className="object-cover w-full h-full rounded-full"
                            />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-1">
                            Puntos Actuales
                        </p>
                        <p className="text-4xl font-bold text-foreground tracking-tight drop-shadow-sm">{client.points}</p>
                    </div>
                </div>

                {/* VIP Progress inside Card */}
                {client.vip && (
                    <div className="relative z-10 pt-4 space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <div>
                                <h3 className="text-[13px] font-extrabold tracking-tight text-foreground uppercase">
                                    Nivel: <span className={`${tierStyle.text} ml-1`}>
                                        {{ "none": "Ninguno", "bronze": "Bronce", "silver": "Plata", "gold": "Oro", "vip": "VIP" }[client.vip.currentTier as string] || client.vip.currentTier.toUpperCase()}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                    {client.vip.lifetimePoints} Pts Históricos
                                </p>
                            </div>
                            {client.vip.currentTier !== "vip" && (
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Próximo</p>
                                    <p className="text-xs font-semibold text-foreground">{client.vip.nextTierName}</p>
                                </div>
                            )}
                        </div>

                        {client.vip.currentTier !== "vip" && (
                            <div className="space-y-1.5 pt-1">
                                <div className="h-2.5 w-full bg-accent/80 dark:bg-accent/40 rounded-full overflow-hidden flex shadow-inner border border-border/30">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${tierStyle.progress}`}
                                        style={{ width: `${Math.min(100, (client.vip.lifetimePoints / client.vip.nextTierPoints) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium text-center">
                                    Te faltan <span className="text-foreground font-bold">{Math.max(0, client.vip.nextTierPoints - client.vip.lifetimePoints)} puntos</span> para subir
                                </p>
                            </div>
                        )}
                        {client.vip.currentTier === "vip" && (
                            <div className="text-center pt-2">
                                <p className="text-xs font-bold text-primary">⭐ ¡Has alcanzado el nivel máximo!</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative flex items-center justify-between pt-5 border-t border-border/40 z-10 mt-6">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                        Crew Zingy Member
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 font-mono tracking-wider">
                        #{String(client.id).padStart(6, "0")}
                    </span>
                </div>
            </div>

            {/* Aviso Auth */}
            {notice && (
                <div className="p-4 bg-card border border-border rounded-xl">
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{notice}</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
                <Link
                    href="/rewards"
                    className="group p-5 bg-card border border-border/50 shadow-sm rounded-2xl flex flex-col items-center gap-3 hover:border-border hover:shadow-md transition-all active:scale-95"
                >
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Gift size={24} className="text-primary" />
                    </div>
                    <span className="text-sm text-center text-foreground font-medium">
                        Canjear Premios
                    </span>
                </Link>
                <Link
                    href="/scan"
                    className="group p-5 bg-card border border-border/50 shadow-sm rounded-2xl flex flex-col items-center gap-3 hover:border-border hover:shadow-md transition-all active:scale-95"
                >
                    <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                        <QrCode size={24} className="text-success" />
                    </div>
                    <span className="text-sm text-center text-foreground font-medium">
                        Sumar Puntos
                    </span>
                </Link>
            </div>

            {/* Pending Redemptions */}
            {pendingRedemptions.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                        Canjes Pendientes
                    </h2>
                    {pendingRedemptions.map((r) => (
                        <div
                            key={r.id}
                            className="p-4 bg-card border border-yellow-500/30 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-warning/10 rounded-lg">
                                    <Ticket size={20} className="text-warning" />
                                </div>
                                <div>
                                    <p className="text-foreground text-sm font-medium">
                                        Ticket de Canje
                                    </p>
                                    <p className="text-muted-foreground text-xs font-mono">
                                        {r.ticketUuid.slice(0, 8)}...
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-warning/10 text-warning rounded-lg text-xs font-medium">
                                Pendiente
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
