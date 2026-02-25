/**
 * admin/layout.tsx
 * Descripcion: Layout principal del panel de administracion con sidebar
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-21
 * Descripcion de la modificacion: Agregado sidebar de navegacion y SessionProvider
 */

import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

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
            <div className="min-h-screen bg-background">
                <AdminSidebar />
                <main className="lg:ml-64 pt-14 min-h-screen">{children}</main>
            </div>
            <Toaster position="top-center" richColors />
        </SessionProvider>
    );
}
