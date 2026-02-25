/**
 * (client)/layout.tsx
 * Descripcion: Layout mobile-first para la PWA del cliente con bottom nav
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion de la modificacion: ThemeProvider independiente con storageKey="theme-client"
 */

import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClientBottomNav } from "@/components/shared/client-nav";
import { getPublicSettings } from "@/actions/client";
import { ClientTypebotBubble } from "@/components/shared/client-typebot";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { ClientNotificationBell } from "@/components/shared/client-notification-bell";
import { ThemeProvider } from "@/components/shared/theme-provider";

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getClientSession();
    if (!session) redirect("/login");

    const settings = await getPublicSettings();

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme-client"
        >
            <div className="min-h-screen bg-muted/30 dark:bg-background pb-20 flex flex-col items-center">
                {/* Top Header for Desktop & Mobile with Logo and Actions */}
                <header className="w-full max-w-md mx-auto sticky top-0 z-40 bg-muted/40 dark:bg-background/80 backdrop-blur-md border-b border-border/50 supports-[backdrop-filter]:bg-muted/40 dark:supports-[backdrop-filter]:bg-background/60">
                    <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                        {/* Logo area */}
                        <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span className="font-bold text-foreground tracking-tight">Zingy<span className="text-primary">Store</span></span>
                        </Link>
                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            <ClientNotificationBell />
                            <ModeToggle />
                            {settings && settings.typebot_url ? (
                                <ClientTypebotBubble typebotUrl={settings.typebot_url} />
                            ) : null}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 w-full overflow-y-auto pb-20 custom-scrollbar">
                    {children}
                </main>

                {/* Bottom Navigation */}
                <div className="w-full max-w-md mx-auto">
                    <ClientBottomNav />
                </div>
            </div>
        </ThemeProvider>
    );
}

