import { destroyClientSession } from "@/lib/auth/client-jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Es seguro invocar la eliminación de cookies aquí porque es un Route Handler, 
    // a diferencia de ClientLayout que es un Server Component en `layout.tsx` (causaba error 500).
    await destroyClientSession();

    const blockedMsg = req.nextUrl.searchParams.get("blocked");

    // Forzamos la detección del host real para evitar que Node resuelva a 0.0.0.0
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

    const loginUrl = new URL("/login", `${protocol}://${host}`);

    if (blockedMsg) {
        loginUrl.searchParams.set("blocked", blockedMsg);
    }

    return NextResponse.redirect(loginUrl);
}
