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
import { Gift, QrCode, Ticket, Sparkles, Trophy, Star } from "lucide-react";

const getTierStyle = (tier: string) => {
    switch (tier) {
        case "bronze":
            return {
                card: "border-[#CD7F32]/50 bg-gradient-to-br from-[#CD7F32]/20 via-card to-[#8A5A29]/10 shadow-[0_0_20px_rgba(205,127,50,0.15)]",
                blob: "bg-[#CD7F32] opacity-15",
                text: "text-[#CD7F32] dark:text-[#E69D56] font-black drop-shadow-sm",
                progress: "bg-gradient-to-r from-[#8A5A29] to-[#CD7F32]",
                badge: "bg-[#CD7F32]/20 text-[#CD7F32] border-[#CD7F32]/30",
                icon: <Trophy size={16} className="text-[#CD7F32]" />,
            };
        case "silver":
            return {
                card: "border-blue-400/50 bg-gradient-to-br from-blue-400/20 via-card to-slate-400/10 shadow-[0_0_20px_rgba(96,165,250,0.2)]",
                blob: "bg-blue-400 opacity-20",
                text: "text-blue-500 dark:text-blue-400 font-black drop-shadow-sm",
                progress: "bg-gradient-to-r from-slate-400 to-blue-400",
                badge: "bg-blue-400/20 text-blue-500 dark:text-blue-400 border-blue-400/30",
                icon: <Trophy size={16} className="text-blue-500 dark:text-blue-400" />,
            };
        case "gold":
            return {
                card: "border-yellow-400/60 bg-gradient-to-br from-yellow-400/25 via-card to-amber-500/15 shadow-[0_0_25px_rgba(250,204,21,0.25)]",
                blob: "bg-yellow-400 opacity-25",
                text: "text-amber-500 dark:text-yellow-400 font-black drop-shadow-md",
                progress: "bg-gradient-to-r from-amber-500 to-yellow-400",
                badge: "bg-yellow-400/20 text-amber-500 dark:text-yellow-400 border-yellow-400/40",
                icon: <Star size={16} className="text-amber-500 dark:text-yellow-400" />,
            };
        case "vip":
            return {
                card: "border-red-500/60 bg-gradient-to-br from-red-500/25 via-card to-rose-600/15 shadow-[0_0_30px_rgba(239,68,68,0.3)]",
                blob: "bg-red-500 opacity-25",
                text: "text-red-600 dark:text-red-500 font-black drop-shadow-md",
                progress: "bg-gradient-to-r from-rose-600 to-red-500",
                badge: "bg-red-500/20 text-red-600 dark:text-red-500 border-red-500/40",
                icon: <Sparkles size={16} className="text-red-600 dark:text-red-500" />,
            };
        case "none":
        default:
            return {
                card: "border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card",
                blob: "bg-primary opacity-5",
                text: "text-primary font-bold",
                progress: "bg-primary",
                badge: "bg-primary/10 text-primary border-primary/20",
                icon: <Trophy size={16} className="text-primary" />,
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
            <div className={`relative border backdrop-blur-md rounded-3xl p-6 space-y-6 overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${tierStyle.card}`}>
                {/* Background Blobs for 3D/Glassmorphism feel */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className={`absolute -top-10 -right-10 w-64 h-64 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 ease-out ${tierStyle.blob}`} />
                    <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 delay-100 ease-out ${tierStyle.blob}`} />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
                </div>

                <div className="relative flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`absolute inset-0 rounded-full blur-md ${tierStyle.blob} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-sm ring-2 ring-background border border-border/20 z-10">
                                <Image
                                    src={`/avatars/${client.avatarSvg}`}
                                    alt="Avatar"
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 flex items-center justify-end gap-1">
                            Balance Actual
                        </p>
                        <p className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm flex items-end justify-end gap-1">
                            {client.points}
                            <span className="text-lg font-bold text-muted-foreground tracking-normal translate-y-[-8px]">pts</span>
                        </p>
                    </div>
                </div>

                {/* VIP Progress inside Card */}
                {client.vip && (
                    <div className="relative z-10 pt-4 pb-1 space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <div>
                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border mb-1.5 shadow-sm ${tierStyle.badge}`}>
                                    {tierStyle.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Nivel {{ "none": "Ninguno", "bronze": "Bronce", "silver": "Plata", "gold": "Oro", "vip": "VIP" }[client.vip.currentTier as string] || client.vip.currentTier.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                                    <span className="text-foreground font-bold">{client.vip.lifetimePoints}</span> Puntos Históricos
                                </p>
                            </div>
                            {client.vip.currentTier !== "vip" && (
                                <div className="text-right pb-1">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Próximo</p>
                                    <p className="text-xs font-black text-foreground drop-shadow-sm">{client.vip.nextTierName}</p>
                                </div>
                            )}
                        </div>

                        {client.vip.currentTier !== "vip" ? (
                            <div className="space-y-2 mt-1">
                                <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner border border-black/5 dark:border-white/5 relative">
                                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_right,white,transparent)]" />
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${tierStyle.progress}`}
                                        style={{ width: `${Math.min(100, (client.vip.lifetimePoints / client.vip.nextTierPoints) * 100)}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/40" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground px-1">
                                    <span>Te faltan <b className="text-foreground">{Math.max(0, client.vip.nextTierPoints - client.vip.lifetimePoints)} pts</b></span>
                                    <span>Meta: {client.vip.nextTierPoints}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center pt-2 pb-1">
                                <p className="text-xs font-bold text-red-500/90 dark:text-red-400 bg-red-500/10 inline-block px-4 py-2 rounded-full border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                    ⭐ ¡Has alcanzado la élite más alta!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative flex items-center justify-between px-4 py-3 -mx-6 -mb-6 mt-4 bg-black/15 dark:bg-black/25 z-10 rounded-b-3xl">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1.5 opacity-80">
                        Crew Zingy Member
                    </span>
                    <span className="text-[12px] font-black text-muted-foreground tracking-widest bg-white/10 dark:bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        #{String(client.id).padStart(6, "0")}
                    </span>
                </div>
            </div>

            {/* Aviso Auth */}
            {notice && (
                <div className="p-4 bg-muted/40 border border-warning/30 rounded-2xl shadow-sm">
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{notice}</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
                <Link
                    href="/rewards"
                    className="group py-6 px-4 bg-card border shadow-sm rounded-2xl flex flex-col items-center gap-3 hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
                >
                    <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <Gift size={26} className="text-primary" />
                    </div>
                    <span className="text-sm text-center text-foreground font-bold">
                        Catálogo
                    </span>
                </Link>
                <Link
                    href="/scan"
                    className="group py-6 px-4 bg-card border shadow-sm rounded-2xl flex flex-col items-center gap-3 hover:border-success/50 hover:shadow-md transition-all active:scale-95"
                >
                    <div className="p-3 bg-success/10 rounded-2xl group-hover:bg-success/20 group-hover:scale-110 transition-all duration-300">
                        <QrCode size={26} className="text-success" />
                    </div>
                    <span className="text-sm text-center text-foreground font-bold">
                        Sumar
                    </span>
                </Link>
            </div>

            {/* Pending Redemptions */}
            {pendingRedemptions.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
                    <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">
                        Canjes Pendientes
                    </h2>
                    {pendingRedemptions.map((r) => (
                        <div
                            key={r.id}
                            className="p-4 bg-gradient-to-r from-warning/10 to-card border border-warning/30 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 bg-warning/20 rounded-xl shadow-sm">
                                    <Ticket size={24} className="text-warning-foreground" />
                                </div>
                                <div>
                                    <p className="text-foreground text-sm font-bold">
                                        Ticket de Canje
                                    </p>
                                    <p className="text-muted-foreground text-[11px] font-mono bg-background/50 px-1.5 py-0.5 rounded mt-1 inline-block border border-border/50">
                                        {r.ticketUuid.slice(0, 8).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-warning text-warning-foreground rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm relative z-10">
                                Pendiente
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
