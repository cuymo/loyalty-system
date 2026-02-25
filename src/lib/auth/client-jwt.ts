/**
 * lib/auth/client-jwt.ts
 * Descripcion: Utilidades JWT para sesiones de clientes (separado de Auth.js admin)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const NEW_JWT_SECRET = new TextEncoder().encode(
    process.env.CLIENT_JWT_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

// Fallback al antiguo secret (durante 30 días para no desloguear usuarios)
const OLD_JWT_SECRET = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

const COOKIE_NAME = "crew-zingy-client-session";

export interface ClientSession {
    clientId: number;
    phone: string;
    username: string;
}

export async function createClientSession(payload: ClientSession) {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("3d")
        .setIssuedAt()
        .sign(NEW_JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3 * 24 * 60 * 60, // 3 days
    });

    return token;
}

export async function getClientSession(): Promise<ClientSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    try {
        // Intento primario: Validar con la llave nueva
        const { payload } = await jwtVerify(token, NEW_JWT_SECRET);
        return {
            clientId: payload.clientId as number,
            phone: payload.phone as string,
            username: payload.username as string,
        };
    } catch {
        // Fallback: Si falla, intentar con la llave antigua (Graceful Rotation)
        try {
            const { payload } = await jwtVerify(token, OLD_JWT_SECRET);
            const sessionData = {
                clientId: payload.clientId as number,
                phone: payload.phone as string,
                username: payload.username as string,
            };

            // Intentar re-firmar y sobrescribir la cookie silenciosamente con la llave nueva
            // Next.js puede arrojar error si esto se llama desde un Server Component (solo lectura).
            // Lo envolvemos en un try/catch para ignorar el error de framework: los tokens antiguos
            // expirarán naturalmente en 3 días de todos modos si no pueden ser re-firmados aquí.
            try {
                const cookieStore = await cookies();
                const newToken = await new SignJWT({ ...sessionData })
                    .setProtectedHeader({ alg: "HS256" })
                    .setExpirationTime("3d")
                    .setIssuedAt()
                    .sign(NEW_JWT_SECRET);

                cookieStore.set(COOKIE_NAME, newToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    path: "/",
                    maxAge: 3 * 24 * 60 * 60, // 3 days
                });
            } catch (cookieError) {
                // Ignore silent refresh error in pure Server Components (read-only cookie layer)
            }

            return sessionData;
        } catch {
            return null; // Ambas firmas fallaron, sesión inválida
        }
    }
}

export async function destroyClientSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// ============================================
// REGISTRATION TOKEN (Corto plazo, para asegurar el registro)
// ============================================

const REG_COOKIE_NAME = "crew-zingy-registration-token";

export async function createRegistrationToken(phone: string) {
    const token = await new SignJWT({ phone })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .setIssuedAt()
        .sign(NEW_JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(REG_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 minutos de gracia
    });
}

export async function verifyRegistrationToken(phone: string): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get(REG_COOKIE_NAME)?.value;
    if (!token) return false;

    try {
        const { payload } = await jwtVerify(token, NEW_JWT_SECRET);
        return payload.phone === phone;
    } catch {
        return false;
    }
}

export async function destroyRegistrationToken() {
    const cookieStore = await cookies();
    cookieStore.delete(REG_COOKIE_NAME);
}
