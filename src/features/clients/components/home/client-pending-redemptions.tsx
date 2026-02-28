import { Ticket } from "lucide-react";

export interface PendingRedemptionsProps {
    redemptions: {
        id: number;
        status: string;
        ticketUuid: string;
    }[];
}

export function ClientPendingRedemptions({ redemptions }: PendingRedemptionsProps) {
    if (redemptions.length === 0) return null;

    return (
        <div className="space-y-3 animate-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
            <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">
                Canjes Pendientes
            </h2>
            {redemptions.map((r) => (
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
    );
}
