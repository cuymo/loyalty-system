/**
ID: act_0001
Conjunto de Server Actions para la gestión integral de clientes, incluyendo autenticación OTP, registro, manejo de puntos y canjes.
*/

"use server";

import { db } from "@/db";
import { clients, codes, rewards, redemptions, nameChangesHistory, appNotifications, adminNotifications } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, isNull } from "drizzle-orm";
import {
    createClientSession,
    getClientSession,
    destroyClientSession,
    createRegistrationToken,
    verifyRegistrationToken,
    destroyRegistrationToken
} from "@/lib/auth/client-jwt";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { readdir } from "fs/promises";
import { join } from "path";
import { triggerWebhook } from "@/lib/webhook";
import { eventBus } from "@/lib/events";
import { processReferral } from "@/features/client/referrals/actions/client-referrals-logic";
import bcrypt from "bcryptjs";

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

/**
ID: act_0002
Obtención de configuraciones públicas del sistema accesibles desde el lado del cliente.
*/

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

/**
ID: act_0008
Vinculación de un código de referido a la cuenta del cliente actual para otorgar beneficios mutuos.
*/
export async function applyReferralCode(code: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const cleanCode = code.replace(/\D/g, "");
    const referrerId = parseInt(cleanCode);
    if (isNaN(referrerId)) return { success: false, error: "Código inválido" };

    if (referrerId === session.clientId) {
        return { success: false, error: "No puedes usar tu propio código" };
    }

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return { success: false, error: "Cliente no encontrado" };
    if (client.referredBy) {
        return { success: false, error: "Ya has canjeado un código de referido anteriormente" };
    }

    const [referrer] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, referrerId))
        .limit(1);

    if (!referrer) {
        return { success: false, error: "El código de referido no existe" };
    }

    try {
        await db.transaction(async (tx) => {
            const result = await processReferral(tx, referrerId, session.clientId, true);
            if (!result.success) throw new Error(result.error);
        });

        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        console.error("Error al aplicar referido:", e);
        return { success: false, error: e.message || "Error interno al procesar el código" };
    }
}


/**
ID: act_0009
Bloque de funciones para la gestión de perfil de usuario, incluyendo niveles VIP y cambios de nombre.
*/

/**
ID: act_0010
Recuperación del perfil completo del cliente, calculando el nivel VIP y los cambios de nombre restantes en el ciclo actual.
*/
export async function getClientProfile() {
    const session = await getClientSession();
    if (!session) return null;

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return null;

    // Logic for 2 name changes per membership year
    const registrationDate = client.createdAt;
    const now = new Date();

    let membershipYearStart = new Date(registrationDate);
    membershipYearStart.setFullYear(now.getFullYear());

    if (now < membershipYearStart) {
        membershipYearStart.setFullYear(now.getFullYear() - 1);
    }

    let membershipYearEnd = new Date(membershipYearStart);
    membershipYearEnd.setFullYear(membershipYearStart.getFullYear() + 1);

    const pastChangesInYear = await db
        .select()
        .from(nameChangesHistory)
        .where(
            and(
                eq(nameChangesHistory.clientId, session.clientId),
                gte(nameChangesHistory.createdAt, membershipYearStart),
                lte(nameChangesHistory.createdAt, membershipYearEnd)
            )
        );

    const changesRemaining = Math.max(0, 2 - pastChangesInYear.length);

    // VIP Tier Logic
    const pubSettings = await getPublicSettings();
    const tierBronze = parseInt(pubSettings.tier_bronze_points || "100");
    const tierSilver = parseInt(pubSettings.tier_silver_points || "500");
    const tierGold = parseInt(pubSettings.tier_gold_points || "1000");
    const tierVip = parseInt(pubSettings.tier_vip_points || "5000");

    let currentTier = "none";
    let nextTierPoints = tierBronze;
    let nextTierName = "Bronce";

    if (client.lifetimePoints >= tierVip) {
        currentTier = "vip";
        nextTierPoints = tierVip; // Reached max
        nextTierName = "Nivel Máximo";
    } else if (client.lifetimePoints >= tierGold) {
        currentTier = "gold";
        nextTierPoints = tierVip;
        nextTierName = "VIP";
    } else if (client.lifetimePoints >= tierSilver) {
        currentTier = "silver";
        nextTierPoints = tierGold;
        nextTierName = "Oro";
    } else if (client.lifetimePoints >= tierBronze) {
        currentTier = "bronze";
        nextTierPoints = tierSilver;
        nextTierName = "Plata";
    }

    const vip = {
        currentTier,
        nextTierPoints,
        nextTierName,
        lifetimePoints: client.lifetimePoints
    };

    return { ...client, changesRemaining, vip };
}

/**
ID: act_0011
Actualización de los datos del perfil del cliente, manejando restricciones en el cambio de nombre de usuario.
*/
export async function updateClientProfile(data: {
    username?: string;
    avatarSvg?: string;
    wantsMarketing?: boolean;
    wantsTransactional?: boolean;
}) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const [currentClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!currentClient) return { success: false, error: "Cliente no encontrado" };

    if (data.username && data.username !== currentClient.username) {
        const [existing] = await db
            .select()
            .from(clients)
            .where(eq(clients.username, data.username))
            .limit(1);

        if (existing && existing.id !== session.clientId) {
            return { success: false, error: "Nombre de usuario ya en uso" };
        }

        // Logic for 2 name changes per membership year
        const registrationDate = currentClient.createdAt;
        const now = new Date();

        let membershipYearStart = new Date(registrationDate);
        membershipYearStart.setFullYear(now.getFullYear());

        if (now < membershipYearStart) {
            membershipYearStart.setFullYear(now.getFullYear() - 1);
        }

        let membershipYearEnd = new Date(membershipYearStart);
        membershipYearEnd.setFullYear(membershipYearStart.getFullYear() + 1);

        const pastChangesInYear = await db
            .select()
            .from(nameChangesHistory)
            .where(
                and(
                    eq(nameChangesHistory.clientId, session.clientId),
                    gte(nameChangesHistory.createdAt, membershipYearStart),
                    lte(nameChangesHistory.createdAt, membershipYearEnd)
                )
            );

        if (pastChangesInYear.length >= 2) {
            return { success: false, error: "Has alcanzado el límite de 2 cambios de nombre por año de membresía." };
        }
    }

    if (data.username && data.username !== currentClient.username) {
        await db.transaction(async (tx) => {
            await tx.update(clients).set(data).where(eq(clients.id, session.clientId));
            await tx.insert(nameChangesHistory).values({
                clientId: session.clientId,
                oldNames: [currentClient.username],
                newName: data.username as string,
            });
        });
    } else {
        await db.update(clients).set(data).where(eq(clients.id, session.clientId));
    }

    if (data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional) {
        await triggerWebhook("cliente.perfil_actualizado", {
            clientId: session.clientId,
            username: data.username || currentClient.username,
            avatarSvg: data.avatarSvg || currentClient.avatarSvg,
            phone: session.phone,
            wantsMarketing: data.wantsMarketing !== undefined ? data.wantsMarketing : currentClient.wantsMarketing,
            wantsTransactional: data.wantsTransactional !== undefined ? data.wantsTransactional : currentClient.wantsTransactional
        });
    }



    await db.insert(adminNotifications).values({
        type: "client_updated_profile",
        message: `Cliente actualizó su perfil: ${data.username || currentClient.username}`,
        isRead: false
    });

    revalidatePath("/");
    return { success: true };
}

/**
ID: act_0012
Sección de acciones para la gestión de notificaciones internas del sistema para el cliente.
*/

/**
ID: act_0013
Consulta del número de notificaciones no leídas para mostrar indicadores en la interfaz.
*/
export async function getUnreadNotificationsCount() {
    const session = await getClientSession();
    if (!session) return 0;

    const unread = await db
        .select()
        .from(appNotifications)
        .where(
            and(
                eq(appNotifications.clientId, session.clientId),
                eq(appNotifications.isRead, false)
            )
        );

    return unread.length;
}

/**
ID: act_0014
Recuperación de la lista de notificaciones recientes del cliente, ordenadas cronológicamente.
*/
export async function getAppNotifications() {
    const session = await getClientSession();
    if (!session) return [];

    return db
        .select()
        .from(appNotifications)
        .where(eq(appNotifications.clientId, session.clientId))
        .orderBy(desc(appNotifications.createdAt))
        .limit(20);
}

/**
ID: act_0015
Marca todas las notificaciones pendientes como leídas y revalida la ruta de notificaciones.
*/
export async function markNotificationsAsRead() {
    const session = await getClientSession();
    if (!session) return { success: false };

    await db
        .update(appNotifications)
        .set({ isRead: true })
        .where(
            and(
                eq(appNotifications.clientId, session.clientId),
                eq(appNotifications.isRead, false)
            )
        );

    revalidatePath("/client/notifications");
    return { success: true };
}

/**
ID: act_0016
Cierre de sesión del cliente mediante la destrucción de la cookie de sesión actual.
*/
export async function logoutClient() {
    await destroyClientSession();
}

/**
ID: act_0017
Eliminación lógica de la cuenta del cliente (soft delete), anonimizando el usuario y notificando al sistema.
*/
export async function deleteMyAccount() {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    // Anonimizar username para liberarlo (otros pueden elegirlo)
    const deletedUsername = `deleted_${session.clientId}_${Date.now()}`;

    const [c] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);

    await db.update(clients).set({
        username: deletedUsername,
        points: 0,
        avatarSvg: "default.svg",
        wantsMarketing: false,
        wantsTransactional: false,
        deletedAt: new Date(),
    }).where(eq(clients.id, session.clientId));

    if (c?.wantsTransactional) {
        await triggerWebhook("cliente.cuenta_eliminada", {
            clientId: session.clientId,
            phone: session.phone,
            username: session.username,
            deletedAt: new Date().toISOString(),
        });
    }

    await db.insert(adminNotifications).values({
        type: "client_deleted",
        message: `Cliente eliminó su cuenta: ${session.username} (${session.phone})`,
        isRead: false,
    });

    eventBus.emit("admin_notification", {
        type: "client_deleted",
        message: `Cliente eliminó su cuenta: ${session.username} (${session.phone})`,
    });

    await destroyClientSession();
    return { success: true };
}

/**
ID: act_0018
Sección de acciones para el procesamiento de códigos QR y asignación de puntos.
*/

/**
ID: act_0019
Validación preliminar de un código QR para verificar su existencia, vigencia y estado de uso.
*/
export async function validateCode(codeStr: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const result = await db
        .select()
        .from(codes)
        .where(eq(codes.code, codeStr))
        .limit(1);

    if (!result.length) {
        return { success: false, error: "Codigo no encontrado" };
    }

    const code = result[0];

    if (code.status === "used") {
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }

    const now = new Date();
    if (now > code.expirationDate) {
        return { success: false, error: "Este código ya ha expirado" };
    }

    return {
        success: true,
        pointsValue: code.pointsValue,
    };
}

/**
ID: act_0020
Procesamiento atómico del canje de un código QR, sumando puntos al cliente y marcando el código como usado.
*/
export async function redeemCode(codeStr: string) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const result = await db
        .select()
        .from(codes)
        .where(eq(codes.code, codeStr))
        .limit(1);

    if (!result.length) {
        return { success: false, error: "Codigo no encontrado" };
    }

    const code = result[0];

    if (code.status === "used") {
        return { success: false, error: "Este codigo ya ha sido utilizado" };
    }

    const now = new Date();
    if (now > code.expirationDate) {
        return { success: false, error: "Este código ya ha expirado" };
    }

    // Transaccion ACID: marcar codigo como usado + sumar puntos
    const transactionResult = await db.transaction(async (tx) => {
        const updateCodeResult = await tx
            .update(codes)
            .set({
                status: "used",
                usedAt: new Date(),
                usedBy: session.clientId,
            })
            .where(
                and(
                    eq(codes.id, code.id),
                    eq(codes.status, "unused") // Atomic constraint
                )
            ).returning();

        if (updateCodeResult.length === 0) {
            throw new Error("El código ya fue reclamado por otro proceso");
        }

        await tx
            .update(clients)
            .set({
                points: sql`${clients.points} + ${code.pointsValue}`,
                lifetimePoints: sql`${clients.lifetimePoints} + ${code.pointsValue}`,
            })
            .where(eq(clients.id, session.clientId));

        return true;
    }).catch((e) => {
        return false;
    });

    if (!transactionResult) {
        return { success: false, error: "El código ya fue reclamado por otro proceso paralelo" };
    }

    // Get updated client for total points
    const [updatedClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    // Opcional por WhatsApp (Transaccional)
    if (updatedClient?.wantsTransactional) {
        await triggerWebhook("cliente.puntos_sumados", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            code: codeStr,
            pointsAdded: code.pointsValue,
            batchName: code.batchName,
            newTotalPoints: updatedClient.points
        });
    }

    // Siempre notificar In-App
    await db.insert(appNotifications).values({
        clientId: session.clientId,
        title: "¡Puntos Sumados!",
        body: `Has sumado ${code.pointsValue} puntos. Tu nuevo total es ${updatedClient?.points ?? 0} pts.`,
        isRead: false,
        type: "points_earned"
    });

    await db.insert(adminNotifications).values({
        type: "points_added",
        message: `Cliente sumó puntos: ${session.username} sumó ${code.pointsValue} pts (Lote: ${code.batchName})`,
        isRead: false
    });

    if (updatedClient) {
        const oldLifetime = updatedClient.lifetimePoints - code.pointsValue;

        const pubSettings = await getPublicSettings();
        const tierBronze = parseInt(pubSettings.tier_bronze_points || "100");
        const tierSilver = parseInt(pubSettings.tier_silver_points || "500");
        const tierGold = parseInt(pubSettings.tier_gold_points || "1000");
        const tierVip = parseInt(pubSettings.tier_vip_points || "5000");

        const getTier = (pts: number) => {
            if (pts >= tierVip) return "vip";
            if (pts >= tierGold) return "gold";
            if (pts >= tierSilver) return "silver";
            if (pts >= tierBronze) return "bronze";
            return "none";
        };

        const oldTier = getTier(oldLifetime);
        const newTier = getTier(updatedClient.lifetimePoints);

        if (oldTier !== newTier) {
            if (updatedClient.wantsTransactional) {
                await triggerWebhook("cliente.nivel_alcanzado", {
                    clientId: session.clientId,
                    username: session.username,
                    phone: session.phone,
                    oldTier,
                    newTier,
                    lifetimePoints: updatedClient.lifetimePoints
                });
            }

            await db.insert(appNotifications).values({
                clientId: session.clientId,
                title: "¡Subiste de Nivel VIP!",
                body: `¡Felicidades! Has alcanzado el nivel ${newTier.toUpperCase()}. Disfruta de nuevos beneficios y premios exclusivos.`,
                isRead: false,
                type: "campaign_only_text"
            });
        }
    }

    await db.insert(adminNotifications).values({
        type: "points_added",
        message: `${session.username} sumó ${code.pointsValue} pts`,
        isRead: false
    });

    eventBus.emit("admin_notification", {
        type: "points_added",
        message: `${session.username} sumó ${code.pointsValue} pts`,
    });

    revalidatePath("/");
    return {
        success: true,
        pointsAdded: code.pointsValue,
    };
}

/**
ID: act_0021
Sección de acciones para la visualización y solicitud de canje de recompensas disponibles.
*/

/**
ID: act_0022
Listado de todas las recompensas con estado activo, ordenadas por costo de puntos.
*/
export async function getAvailableRewards() {
    return db
        .select()
        .from(rewards)
        .where(eq(rewards.status, "active"))
        .orderBy(rewards.pointsRequired);
}

/**
ID: act_0023
Generación de una solicitud de canje mediante una transacción atómica que verifica puntos y genera un ticket único.
*/
export async function requestRedemption(rewardId: number) {
    const session = await getClientSession();
    if (!session) return { success: false, error: "No autenticado" };

    const [reward] = await db
        .select()
        .from(rewards)
        .where(eq(rewards.id, rewardId))
        .limit(1);

    if (!reward) return { success: false, error: "Premio no encontrado" };
    if (reward.status !== "active")
        return { success: false, error: "Premio no disponible" };

    const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, session.clientId))
        .limit(1);

    if (!client) return { success: false, error: "Cliente no encontrado" };
    if (client.points < reward.pointsRequired)
        return { success: false, error: "Puntos insuficientes" };

    const ticketUuid = randomUUID();

    // Transaccion ACID: descontar puntos + crear ticket de forma Atomica
    const transactionResult = await db.transaction(async (tx) => {
        const updateClientResult = await tx
            .update(clients)
            .set({ points: sql`${clients.points} - ${reward.pointsRequired}` })
            .where(
                and(
                    eq(clients.id, session.clientId),
                    gte(clients.points, reward.pointsRequired) // Bloqueo anti-saldos negativos
                )
            ).returning();

        if (updateClientResult.length === 0) {
            throw new Error("Puntos insuficientes");
        }

        await tx.insert(redemptions).values({
            clientId: session.clientId,
            rewardId: rewardId,
            ticketUuid,
            pointsSpent: reward.pointsRequired,
            status: "pending",
        });

        return true;
    }).catch(e => false);

    if (!transactionResult) {
        return { success: false, error: "Tus puntos han cambiado o son insuficientes" };
    }

    // Siempre In-App
    await db.insert(appNotifications).values({
        clientId: session.clientId,
        title: "Solicitud de Canje",
        body: `Has solicitado canjear: ${reward.name}. Descontamos ${reward.pointsRequired} pts. Tu solicitud está pendiente de aprobación.`,
        isRead: false,
        type: "points_spent"
    });

    // Opcional por WhatsApp (Transaccional)
    if (client.wantsTransactional) {
        await triggerWebhook("cliente.canje_solicitado", {
            clientId: session.clientId,
            username: session.username,
            phone: session.phone,
            wantsMarketing: client.wantsMarketing,
            wantsTransactional: client.wantsTransactional,
            rewardId,
            rewardName: reward.name,
            rewardType: reward.type,
            ticketUuid,
            pointsSpent: reward.pointsRequired,
            remainingPoints: client.points - reward.pointsRequired
        });
    }

    await db.insert(adminNotifications).values({
        type: "new_redemption",
        message: `${session.username} solicitó canjear: ${reward.name}`,
        isRead: false
    });

    eventBus.emit("admin_notification", {
        type: "new_redemption",
        message: `${session.username} solicitó canjear: ${reward.name}`,
    });

    revalidatePath("/");
    return { success: true, ticketUuid };
}

/**
ID: act_0024
Obtención del historial de canjes del cliente actual, incluyendo detalles de la recompensa y estado del ticket.
*/
export async function getMyRedemptions() {
    const session = await getClientSession();
    if (!session) return [];

    const rows = await db
        .select({
            id: redemptions.id,
            rewardId: redemptions.rewardId,
            ticketUuid: redemptions.ticketUuid,
            pointsSpent: redemptions.pointsSpent,
            status: redemptions.status,
            createdAt: redemptions.createdAt,
            rewardName: rewards.name,
            rewardImageUrl: rewards.imageUrl,
            rewardType: rewards.type,
        })
        .from(redemptions)
        .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
        .where(eq(redemptions.clientId, session.clientId))
        .orderBy(desc(redemptions.createdAt));

    return rows;
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
