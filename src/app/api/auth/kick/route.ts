/**
ID: api_0002
Manejador para forzar el cierre de sesión de clientes (ej: al ser bloqueados), destruyendo cookies y redirigiendo al login.
*/
import { destroyClientSession } from "@/lib/auth/client-jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Es seguro invocar la eliminación de cookies aquí porque es un Route Handler, 
    // a diferencia de ClientLayout que es un Server Component en `layout.tsx` (causaba error 500).
    await destroyClientSession();

    const blockedMsg = req.nextUrl.searchParams.get("blocked");

    // Forzamos la detección del host real (priorizando la variable de entorno para Dokploy/Prod)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const loginUrl = new URL("/login", baseUrl);

    if (blockedMsg) {
        loginUrl.searchParams.set("blocked", blockedMsg);
    }

    return NextResponse.redirect(loginUrl);
}
