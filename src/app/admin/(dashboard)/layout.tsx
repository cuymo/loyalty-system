/**
 * admin/(dashboard)/layout.tsx
 * Descripcion: Layout del panel admin con sidebar shadcn refactorizado
 * Fecha de creacion: 2026-02-21
 * Refactorizado: 2026-02-28 — Migrado a shadcn Sidebar system
 */

import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SiteHeader } from "@/components/layouts/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
    title: "Crew Zingy - Admin",
    description: "Panel de administracion de Crew Zingy",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader />
                    <main className="flex-1 px-4 pb-4 pt-2 lg:px-6 lg:pb-6 lg:pt-4">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </SessionProvider>
    );
}
