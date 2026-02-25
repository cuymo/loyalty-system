/**
 * theme-provider.tsx
 * Descripcion: Wrapper para next-themes (soporte modo oscuro)
 * Autor: Crew Zingy Dev
 */

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
