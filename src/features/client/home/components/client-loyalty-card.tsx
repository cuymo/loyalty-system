import Image from "next/image";
import { Sparkles, Trophy, Star } from "lucide-react";

export interface LoyaltyCardProps {
    client: {
        id: number;
        points: number;
        avatarSvg: string | null;
        vip?: {
            currentTier: string;
            lifetimePoints: number;
            nextTierName: string;
            nextTierPoints: number;
        } | null;
    };
}

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

export function ClientLoyaltyCard({ client }: LoyaltyCardProps) {
    const currentTier = client.vip?.currentTier || "none";
    const tierStyle = getTierStyle(currentTier as string);

    return (
        <div className={`relative border backdrop-blur-md rounded-3xl p-6 space-y-6 overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${tierStyle.card}`}>
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
                                src={`/avatars/${client.avatarSvg || "default.svg"}`}
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
    );
}
