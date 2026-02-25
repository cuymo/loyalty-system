/**
 * middleware.ts
 * Descripcion: Middleware de proteccion de rutas admin (Edge-compatible, sin imports de BD)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isAdminRoute = pathname.startsWith("/admin");
    const isLoginPage = pathname === "/admin/login";
    const isAuthApi = pathname.startsWith("/api/auth");

    // Permitir rutas de API de Auth.js siempre
    if (isAuthApi) {
        return NextResponse.next();
    }

    // Verificar token JWT (Edge-compatible, no importa BD)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Si es ruta admin y NO esta logueado
    if (isAdminRoute && !isLoginPage && !token) {
        const loginUrl = new URL("/admin/login", req.url);
        return NextResponse.redirect(loginUrl);
    }

    // Si ya esta logueado e intenta ir al login, redirigir al dashboard
    if (isLoginPage && token) {
        const dashboardUrl = new URL("/admin", req.url);
        return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
