import { destroyClientSession } from "@/lib/auth/client-jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // Es seguro invocar la eliminación de cookies aquí porque es un Route Handler, 
    // a diferencia de ClientLayout que es un Server Component en `layout.tsx` (causaba error 500).
    await destroyClientSession();

    const blockedMsg = req.nextUrl.searchParams.get("blocked");
    const loginUrl = new URL("/login", req.url);

    if (blockedMsg) {
        loginUrl.searchParams.set("blocked", blockedMsg);
    }

    return NextResponse.redirect(loginUrl);
}
