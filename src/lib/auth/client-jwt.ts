/**
ID: lib_0001
Capa de utilidades JWT para la gestión de sesiones de clientes, independiente de los administradores.
*/

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const clientSecret = process.env.CLIENT_JWT_SECRET;
if (!clientSecret) {
    console.warn("⚠️ ADVERTENCIA: CLIENT_JWT_SECRET no está configurado en .env");
}

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

const NEW_JWT_SECRET = new TextEncoder().encode(
    clientSecret || NEXTAUTH_SECRET || "fallback-desarrollo-solo"
);

/**
ID: lib_0002
Definición de secretos JWT con soporte para rotación de llaves, asegurando la continuidad de las sesiones activas.
*/
const OLD_JWT_SECRET = new TextEncoder().encode(
    NEXTAUTH_SECRET || "fallback-desarrollo-solo"
);

const COOKIE_NAME = "crew-zingy-client-session";

export interface ClientSession {
    clientId: number;
    phone: string;
    username: string;
}

/**
ID: lib_0003
Creación de una sesión de cliente firmada y almacenamiento en una cookie segura de larga duración.
*/
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

/**
ID: lib_0004
Recuperación y validación de la sesión del cliente desde las cookies, con lógica de actualización automática de tokens antiguos.
*/
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

/**
ID: lib_0005
Eliminación de la sesión actual del cliente borrando la cookie correspondiente.
*/
export async function destroyClientSession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/**
ID: lib_0006
Gestión de Tokens de Registro temporales para asegurar el flujo de creación de cuenta.
*/

const REG_COOKIE_NAME = "crew-zingy-registration-token";

/**
ID: lib_0007
Creación de un token de registro efímero (15 min) para validar el número de teléfono durante el onboarding.
*/
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

/**
ID: lib_0008
Verificación de la validez del token de registro contra el número de teléfono proporcionado.
*/
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

/**
ID: lib_0009
Destrucción del token de registro una vez completado el proceso o por expiración.
*/
export async function destroyRegistrationToken() {
    const cookieStore = await cookies();
    cookieStore.delete(REG_COOKIE_NAME);
}
