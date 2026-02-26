/**
 * app/layout.tsx
 * Descripcion: Layout raiz de la aplicacion Crew Zingy
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion de la modificacion: ThemeProvider removido del root, cada route group maneja su propio tema
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Crew Zingy",
  description: "Tu programa de lealtad favorito",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/pwa-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crew Zingy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background`}>
        {children}
      </body>
    </html>
  );
}

