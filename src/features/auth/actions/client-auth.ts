"use server";

import { db } from "@/db";
import { clients, appNotifications, adminNotifications } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createClientSession, createRegistrationToken, destroyRegistrationToken } from "@/lib/auth/client-jwt";
import { triggerWebhook } from "@/lib/webhook";
import { eventBus } from "@/lib/events";
import bcrypt from "bcryptjs";
import { readdir } from "fs/promises";
import { join } from "path";
import { processReferral } from "@/features/client/referrals/actions/client-referrals-logic";

export async function checkFieldAvailability(field: "username" | "email" | "phone", value: string) {
    if (!value) return { available: true };

    const normalizedValue = value.toLowerCase().trim();

    try {
        const [existing] = await db
            .select({ id: clients.id, deletedAt: clients.deletedAt })
            .from(clients)
            .where(
                field === "username"
                    ? eq(clients.username, normalizedValue)
                    : field === "email"
                        ? eq(clients.email, normalizedValue)
                        : eq(clients.phone, normalizedValue)
            )
            .limit(1);

        if (!existing) return { available: true };

        // Si la cuenta está eliminada (soft-delete), el username/email están "reservados" pero el phone indica reactivación
        if (existing.deletedAt) {
            return {
                available: false,
                isDeleted: true,
                message: field === "phone"
                    ? "Esta cuenta fue eliminada. ¿Deseas reactivarla?"
                    : "Este dato pertenece a una cuenta eliminada."
            };
        }

        return {
            available: false,
            isDeleted: false,
            message: field === "username"
                ? "Nombre de usuario ya en uso"
                : field === "email"
                    ? "Correo electrónico ya registrado"
                    : "Este número de teléfono ya tiene una cuenta activa."
        };
    } catch (e) {
        console.error(`Error checking ${field} availability:`, e);
        return { available: false, message: "Error al validar" };
    }
}

export async function getPublicSettings() {
    return {} as Record<string, string>;
}

/**
ID: act_0003
Módulo de autenticación por One-Time Password (OTP) con control de expiración y límites de intentos por seguridad.
*/

// Store temporal de OTPs en memoria (en produccion: Redis o BD)
const otpStore = new Map<string, { otp: string; expiresAt: number; sentAt: number }>();

// Store persistente en memoria para rate limits de seguridad
const rateLimitStore = new Map<string, { requests: number; verifyAttempts: number; lockedUntil: number }>();

const OTP_COOLDOWN_MS = 20_000;  // 20 segundos entre reenvíos
const OTP_MAX_REQUESTS = 3;       // Máximo 3 solicitudes
const OTP_MAX_VERIFIES = 3;       // Máximo 3 intentos de verificación fallidos
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // Bloqueo de 15 minutos
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos de vida

/**
ID: act_0004
Solicitud de un nuevo código OTP para un número de teléfono, validando cooldowns y bloqueos previos.
*/
export async function requestOtp(phone: string) {
    const now = Date.now();
    const rateLimit = rateLimitStore.get(phone) || { requests: 0, verifyAttempts: 0, lockedUntil: 0 };

    // Verificar si está en rate limit local
    if (now < rateLimit.lockedUntil) {
        const remaining = Math.ceil((rateLimit.lockedUntil - now) / 60000);
        return { success: false, error: `Demasiados intentos. Intenta en ${remaining} minutos.`, isLocked: true };
    }

    // Verificar si está bloqueado por un administrador en la BBDD
    const [existingClient] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);

    if (existingClient?.isBlocked) {
        return {
            success: false,
            error: existingClient.blockReason || "Tu cuenta ha sido bloqueada por un administrador.",
            isBlocked: true
        };
    }

    const existingOtp = otpStore.get(phone);

    // Verificar cooldown de envío
    if (existingOtp) {
        const elapsed = now - existingOtp.sentAt;
        if (elapsed < OTP_COOLDOWN_MS) {
            const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
            return { success: false, error: `Espera ${remaining}s para reenviar`, cooldownRemaining: remaining };
        }
    }

    // Verificar máximo de envíos
    if (rateLimit.requests >= OTP_MAX_REQUESTS) {
        rateLimit.lockedUntil = now + OTP_LOCKOUT_MS;
        rateLimit.requests = 0; // reset para después del bloqueo
        rateLimit.verifyAttempts = 0;
        rateLimitStore.set(phone, rateLimit);

        if (existingClient) {
            await db.insert(appNotifications).values({
                clientId: existingClient.id,
                title: "Alerta de Seguridad",
                body: "Tu cuenta ha sido bloqueada por 15 minutos debido a demasiadas solicitudes de código.",
                isRead: false,
                type: "campaign_only_text"
            });
        }

        // Disparar webhook de bloqueo
        if (existingClient?.wantsTransactional ?? true) {
            await triggerWebhook("cliente.cuenta_bloqueada", {
                phone,
                razon: "Límite de envíos excedido (3/3)",
                bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
            });
        }

        return { success: false, error: "Límite de envíos agotado. Bloqueado por 15 minutos.", isLocked: true };
    }

    // Generar OTP de 6 digitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(phone, {
        otp,
        expiresAt: now + OTP_EXPIRY_MS,
        sentAt: now,
    });

    rateLimit.requests += 1;
    rateLimitStore.set(phone, rateLimit);

    // Trigger Webhook para OTP
    await triggerWebhook("cliente.otp_solicitado", {
        phone,
        otp,
        expiresInMinutes: 5,
        attempt: rateLimit.requests,
        status: "pending"
    });

    return { success: true, cooldownRemaining: OTP_COOLDOWN_MS / 1000 };
}

/**
ID: act_0005
Verificación de un código OTP ingresado por el usuario contra el almacén temporal.
*/
export async function verifyOtp(phone: string, otp: string) {
    const now = Date.now();
    const rateLimit = rateLimitStore.get(phone) || { requests: 0, verifyAttempts: 0, lockedUntil: 0 };

    if (now < rateLimit.lockedUntil) {
        const remaining = Math.ceil((rateLimit.lockedUntil - now) / 60000);
        return { success: false, error: `Bloqueado por seguridad. Intenta en ${remaining} minutos.` };
    }

    const stored = otpStore.get(phone);

    if (!stored) {
        return { success: false, error: "No se ha solicitado un código para este número" };
    }

    if (now > stored.expiresAt) {
        otpStore.delete(phone);
        return { success: false, error: "El código ha expirado. Solicita uno nuevo." };
    }

    if (stored.otp !== otp) {
        rateLimit.verifyAttempts += 1;
        if (rateLimit.verifyAttempts >= OTP_MAX_VERIFIES) {
            rateLimit.lockedUntil = now + OTP_LOCKOUT_MS;
            rateLimit.requests = 0;
            rateLimit.verifyAttempts = 0;
            rateLimitStore.set(phone, rateLimit);
            otpStore.delete(phone); // Invalidar código actual

            // Disparar webhook de bloqueo por mala digitación
            const [existingClient] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);

            if (existingClient) {
                await db.insert(appNotifications).values({
                    clientId: existingClient.id,
                    title: "Alerta de Seguridad",
                    body: "Tu cuenta ha sido bloqueada temporalmente por demasiados intentos de código fallidos.",
                    isRead: false,
                    type: "campaign_only_text"
                });
            }

            if (existingClient?.wantsTransactional ?? true) {
                await triggerWebhook("cliente.cuenta_bloqueada", {
                    phone,
                    razon: "Demasiados intentos de verificación fallidos (3/3)",
                    bloqueadoHasta: new Date(rateLimit.lockedUntil).toISOString()
                });
            }

            return { success: false, error: "Demasiados intentos fallidos. Intentos bloqueados por 15 minutos." };
        }
        rateLimitStore.set(phone, rateLimit);
        return { success: false, error: `Código incorrecto. Te quedan ${OTP_MAX_VERIFIES - rateLimit.verifyAttempts} intentos.` };
    }

    // Éxito: Limpiar estado de OTP y límites
    otpStore.delete(phone);
    rateLimitStore.delete(phone);

    // Buscar o crear cliente
    const [existingClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.phone, phone))
        .limit(1);

    if (existingClient) {
        // Bloqueo manual por Admin
        if (existingClient.isBlocked) {
            return {
                success: false,
                error: existingClient.blockReason || "Tu cuenta ha sido bloqueada por un administrador.",
                isBlocked: true
            };
        }

        // Cuenta soft-deleted: reactivar con datos limpios
        if (existingClient.deletedAt) {
            // Liberar el username anterior para que otros lo usen
            const tempUsername = `reactivating_${existingClient.id}_${Date.now()}`;
            await db.update(clients).set({
                deletedAt: null,
                points: 0,
                username: tempUsername,
                avatarSvg: "default.svg",
                wantsMarketing: true,
                wantsTransactional: true,
            }).where(eq(clients.id, existingClient.id));

            if (existingClient.wantsTransactional) {
                await triggerWebhook("cliente.cuenta_reactivada", {
                    clientId: existingClient.id,
                    phone,
                    reactivatedAt: new Date().toISOString(),
                });
            }

            await db.insert(adminNotifications).values({
                type: "client_reactivated",
                message: `Cliente reactivó su cuenta: ${phone}`,
                isRead: false,
            });

            eventBus.emit("admin_notification", {
                type: "client_reactivated",
                message: `Cliente reactivó su cuenta: ${phone}`,
            });

            // Retornar como "nuevo" para que elija nombre y avatar desde cero
            await createRegistrationToken(phone);
            return { success: true, isNew: true, phone };
        }

        // Login normal: actualizar métricas y crear sesion
        await db.update(clients)
            .set({
                lastLoginAt: new Date(),
                loginCount: sql`${clients.loginCount} + 1`
            })
            .where(eq(clients.id, existingClient.id));

        await createClientSession({
            clientId: existingClient.id,
            phone: existingClient.phone,
            username: existingClient.username,
        });

        // Insert persistent login notification
        await db.insert(appNotifications).values({
            clientId: existingClient.id,
            title: "Inicio de Sesión",
            body: `Has iniciado sesión en un nuevo dispositivo el ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })} a las ${new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })}.`,
            isRead: false,
            type: "campaign_only_text"
        });

        // Trigger Webhook
        if (existingClient.wantsTransactional) {
            await triggerWebhook("cliente.sesion_iniciada", {
                clientId: existingClient.id,
                phone: existingClient.phone,
                username: existingClient.username,
                points: existingClient.points,
                avatarSvg: existingClient.avatarSvg
            });
        }

        return { success: true, isNew: false };
    }

    // Es nuevo: necesita registrarse
    await createRegistrationToken(phone);
    return { success: true, isNew: true, phone };
}


/**
ID: act_0006
Autenticación de clientes mediante nombre de usuario y contraseña, con validación de estado de cuenta.
*/

export async function loginClient(username: string, password: string) {
    if (!username || !password) {
        return { success: false, error: "Usuario y contraseña son obligatorios" };
    }

    const normalizedUsername = username.toLowerCase().trim();

    const [client] = await db
        .select()
        .from(clients)
        .where(
            and(
                eq(clients.username, normalizedUsername),
                isNull(clients.deletedAt)
            )
        )
        .limit(1);

    if (!client) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
    }

    if (client.isBlocked) {
        return { success: false, error: "Tu cuenta ha sido bloqueada por un administrador." };
    }

    const isPasswordValid = await bcrypt.compare(password, client.passwordHash);
    if (!isPasswordValid) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
    }

    // Update login stats
    await db.update(clients).set({
        lastLoginAt: new Date(),
        loginCount: (client.loginCount || 0) + 1,
        updatedAt: new Date(),
    }).where(eq(clients.id, client.id));

    await createClientSession({
        clientId: client.id,
        phone: client.phone,
        username: client.username,
    });

    // Security notification
    await db.insert(appNotifications).values({
        clientId: client.id,
        title: "Inicio de Sesión",
        body: `Iniciaste sesión el ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })} a las ${new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })}.`,
        isRead: false,
        type: "campaign_only_text"
    });

    return { success: true };
}


/**
ID: act_0007
Registro de nuevos clientes o reactivación de cuentas eliminadas, incluyendo hashing de contraseña y referidos.
*/

export async function registerClient(data: {
    phone: string;
    email: string;
    username: string;
    password: string;
    avatarSvg: string;
    birthDate: string;
    referredByCode?: number;
    wantsMarketing?: boolean;
    wantsTransactional?: boolean;
}) {
    // Validar datos obligatorios
    if (!data.password || data.password.length < 6) {
        return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return { success: false, error: "El correo electrónico no es válido" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Verificar si es una cuenta reactivada (phone ya existe en BD)
    const [existingPhone] = await db
        .select()
        .from(clients)
        .where(eq(clients.phone, data.phone))
        .limit(1);

    // Verificar unicidad de username (no se permite reutilizar username de otros clientes)
    const [existingUsername] = await db
        .select()
        .from(clients)
        .where(eq(clients.username, data.username))
        .limit(1);

    if (existingUsername && (!existingPhone || existingUsername.id !== existingPhone.id)) {
        return { success: false, error: "Este nombre de usuario ya esta en uso" };
    }

    // Verificar unicidad de email
    const [existingEmail] = await db
        .select()
        .from(clients)
        .where(eq(clients.email, data.email))
        .limit(1);

    // Si es reactivación, permitir cambiar email solo si no está en uso por otro cliente
    // Si es nuevo cliente, rechazar si email ya existe
    if (existingEmail && (!existingPhone || existingEmail.id !== existingPhone.id)) {
        return { success: false, error: "Este correo electrónico ya esta en uso" };
    }

    if (existingPhone && !existingPhone.deletedAt) {
        return {
            success: false,
            error: "Este número de teléfono ya está registrado y activo. Por favor, inicia sesión o recupera tu contraseña."
        };
    }

    if (existingPhone && existingPhone.deletedAt) {
        // Cuenta reactivada: actualizar username, avatar, birthDate, email y password
        await db.update(clients).set({
            username: data.username,
            email: data.email,
            passwordHash,
            avatarSvg: data.avatarSvg,
            birthDate: data.birthDate,
            deletedAt: null, // Restaurar cuenta
            wantsMarketing: data.wantsMarketing ?? true,
            wantsTransactional: data.wantsTransactional ?? true,
        }).where(eq(clients.id, existingPhone.id));

        await createClientSession({
            clientId: existingPhone.id,
            phone: data.phone,
            username: data.username,
        });

        if (data.wantsTransactional ?? true) {
            await triggerWebhook("cliente.cuenta_reactivada", {
                clientId: existingPhone.id,
                phone: data.phone,
                username: data.username,
                avatarSvg: data.avatarSvg,
                reactivated: true,
                createdAt: new Date().toISOString()
            });
        }

        // Insert persistent login notification for security tracking
        await db.insert(appNotifications).values({
            clientId: existingPhone.id,
            title: "Cuenta Reactivada e Inicio de Sesión",
            body: `Has reactivado tu cuenta e iniciado sesión el ${new Date().toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' })} a las ${new Date().toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })}.`,
            isRead: false,
            type: "campaign_only_text"
        });

        await db.insert(adminNotifications).values({
            type: "new_client",
            message: `Cliente reactivado: ${data.username}`,
            isRead: false
        });

        eventBus.emit("admin_notification", {
            type: "new_client",
            message: `Cliente reactivado: ${data.username}`,
        });

        await destroyRegistrationToken();
        return { success: true };
    }

    // Handle Referral logic
    let validReferrer = false;

    if (data.referredByCode) {
        const [referrer] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, data.referredByCode))
            .limit(1);

        if (referrer) {
            validReferrer = true;
        } else {
            return { success: false, error: "El código de referido ingresado no existe." };
        }
    }

    const [newClient] = await db
        .insert(clients)
        .values({
            phone: data.phone,
            email: data.email,
            username: data.username,
            passwordHash,
            avatarSvg: data.avatarSvg,
            birthDate: data.birthDate,
            referredBy: null, // assigned by processReferral
            points: 0,
            wantsMarketing: data.wantsMarketing ?? true,
            wantsTransactional: data.wantsTransactional ?? true,
            lastLoginAt: new Date(),
            loginCount: 1,
        })
        .returning();

    let referralBonusReferred = 0;

    if (validReferrer) {
        try {
            await db.transaction(async (tx) => {
                const result = await processReferral(tx, data.referredByCode!, newClient.id, false);
                if (result.success && result.pointsReferred) {
                    referralBonusReferred = result.pointsReferred;
                }
            });
        } catch (e) {
            console.error("Error al procesar referido en registro:", e);
        }
    }

    await createClientSession({
        clientId: newClient.id,
        phone: data.phone,
        username: data.username,
    });

    // Trigger Webhook de Registro
    if (data.wantsTransactional ?? true) {
        await triggerWebhook("cliente.registrado", {
            clientId: newClient.id,
            phone: data.phone,
            username: data.username,
            avatarSvg: data.avatarSvg,
            referredByCode: validReferrer ? data.referredByCode : null,
            bonusAwarded: referralBonusReferred,
            timestamp: new Date().toISOString()
        });
    }

    // Insert persistent login notification for security tracking
    await db.insert(appNotifications).values({
        clientId: newClient.id,
        title: "¡Bienvenido a Crew Zingy!",
        body: `Te has registrado exitosamente. ${validReferrer ? `Empezaste con ${referralBonusReferred} puntos gracias a tu código de invitado.` : 'Disfruta de tus beneficios.'}`,
        isRead: false,
        type: "campaign_only_text"
    });

    await db.insert(adminNotifications).values({
        type: "new_client",
        message: `Nuevo cliente registrado: ${data.username}`,
        isRead: false
    });

    eventBus.emit("admin_notification", {
        type: "new_client",
        message: `Nuevo cliente registrado: ${data.username}`,
    });

    await destroyRegistrationToken();
    return { success: true };
}

// ============================================
// AVATARES SVG
// ============================================

export async function getAvailableAvatars() {
    try {
        const avatarsPath = join(process.cwd(), "public", "avatars");
        const files = await readdir(avatarsPath);
        return files.filter((f) => f.endsWith(".svg"));
    } catch {
        return [];
    }
}


