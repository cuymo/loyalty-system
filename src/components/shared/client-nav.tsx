/**
 * components/shared/client-nav.tsx
 * Descripcion: Barra de navegacion inferior para la PWA del cliente
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gift, QrCode, User } from "lucide-react";

const navItems = [
    { label: "Inicio", href: "/home", icon: Home },
    { label: "Premios", href: "/rewards", icon: Gift },
    { label: "Escanear", href: "/scan", icon: QrCode },
    { label: "Perfil", href: "/profile", icon: User },
];

export function ClientBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 dark bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 z-40 safe-area-bottom">
            <div className="max-w-md mx-auto flex items-center justify-around py-3 px-2">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive
                                ? "text-white"
                                : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            <item.icon
                                size={20}
                                className={isActive ? "stroke-[2.5]" : "stroke-[1.5]"}
                            />
                            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
