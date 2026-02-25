/**
 * (auth)/layout.tsx
 * Descripcion: Layout para rutas de autenticacion (login, register, terms, privacy)
 * Fecha de creacion: 2026-02-23
 * Autor: Crew Zingy Dev
 * Nota: Usa la misma storageKey que el cliente para compartir preferencia de tema
 */

import { ThemeProvider } from "@/components/shared/theme-provider";

export default function AuthLayout({
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
            storageKey="theme-client"
        >
            {children}
        </ThemeProvider>
    );
}
