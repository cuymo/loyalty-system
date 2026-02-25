/**
 * admin/layout.tsx
 * Descripcion: Layout del panel de administracion con ThemeProvider independiente
 * Fecha de creacion: 2026-02-23
 * Autor: Crew Zingy Dev
 */

import { ThemeProvider } from "@/components/shared/theme-provider";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme-admin"
        >
            {children}
        </ThemeProvider>
    );
}
