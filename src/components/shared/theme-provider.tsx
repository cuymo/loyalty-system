/**
ID: ui_0012
Proveedor de contexto para la gestión de temas, permitiendo el cambio dinámico de apariencia.
*/

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
