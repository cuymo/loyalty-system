import Link from "next/link";
import { Gift, QrCode } from "lucide-react";

export function ClientQuickActions() {
    return (
        <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
            <Link
                href="/client/rewards"
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
                href="/client/scan"
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
    );
}
