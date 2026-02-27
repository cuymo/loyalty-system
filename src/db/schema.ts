/**
 * schema.ts
 * Descripcion: Definicion completa del esquema de base de datos para Crew Zingy
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import {
    mysqlTable,
    varchar,
    int,
    bigint,
    text,
    boolean,
    timestamp,
    mysqlEnum,
    serial,
} from "drizzle-orm/mysql-core";

// ============================================
// TABLA: admins
// Único Administrador Global
// ============================================
export const admins = mysqlTable("admins", {
    id: serial().primaryKey(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: clients
// Clientes registrados via OTP de WhatsApp
// ============================================
export const clients = mysqlTable("clients", {
    id: serial().primaryKey(),
    phone: varchar({ length: 10 }).notNull().unique(),
    username: varchar({ length: 50 }).notNull().unique(),
    avatarSvg: varchar({ length: 100 }).notNull().default("default.svg"),
    birthDate: varchar({ length: 10 }), // Formato YYYY-MM-DD
    points: int().notNull().default(0),
    lifetimePoints: int().notNull().default(0),
    referralCount: int().notNull().default(0),
    referredBy: bigint({ mode: "number", unsigned: true }).references(
        (): any => clients.id
    ),
    wantsMarketing: boolean("wants_marketing").notNull().default(true),
    wantsTransactional: boolean("wants_transactional").notNull().default(true),
    wantsInAppNotifs: boolean("wants_in_app_notifs").notNull().default(true),
    deletedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: campaigns (ELIMINADA)
// ============================================

// ============================================
// TABLA: rewards
// Catalogo de premios canjeables por puntos
// ============================================
export const rewards = mysqlTable("rewards", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    imageUrl: varchar({ length: 500 }),
    pointsRequired: int().notNull(),
    requiredTier: mysqlEnum(["none", "bronze", "silver", "gold", "vip"]).notNull().default("none"),
    type: mysqlEnum(["discount", "product"]).notNull(),
    status: mysqlEnum(["active", "inactive"]).notNull().default("active"),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: codes
// Codigos QR generados en lotes, asociados a campanas
// ============================================
export const codes = mysqlTable("codes", {
    id: serial().primaryKey(),
    code: varchar({ length: 50 }).notNull().unique(),
    expirationDate: timestamp().notNull(),
    batchName: varchar({ length: 100 }).notNull(),
    pointsValue: int().notNull().default(1),
    status: mysqlEnum(["unused", "used"]).notNull().default("unused"),
    usedAt: timestamp(),
    usedByClientId: bigint({ mode: "number", unsigned: true }).references(() => clients.id),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: redemptions
// Registro de canjes de premios por clientes
// ============================================
export const redemptions = mysqlTable("redemptions", {
    id: serial().primaryKey(),
    clientId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id),
    rewardId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => rewards.id),
    ticketUuid: varchar({ length: 36 }).notNull().unique(),
    pointsSpent: int().notNull(),
    status: mysqlEnum(["pending", "approved", "rejected"])
        .notNull()
        .default("pending"),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: settings
// Configuracion global de la plataforma
// ============================================
export const settings = mysqlTable("settings", {
    id: serial().primaryKey(),
    key: varchar({ length: 100 }).notNull().unique(),
    value: text(),
    updatedAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: webhook_events
// Configuracion de eventos/webhooks para n8n
// ============================================
export const webhookEvents = mysqlTable("webhook_events", {
    id: serial().primaryKey(),
    eventName: varchar({ length: 100 }).notNull().unique(),
    webhookUrl: varchar({ length: 500 }),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: name_changes_history
// Historial de cambios de nombre para auditoría y límites
// ============================================
export const nameChangesHistory = mysqlTable("name_changes_history", {
    id: serial().primaryKey(),
    clientId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id),
    oldName: varchar({ length: 50 }).notNull(),
    newName: varchar({ length: 50 }).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: app_notifications
// Historial de campanita in-app
// ============================================
export const appNotifications = mysqlTable("app_notifications", {
    id: serial().primaryKey(),
    clientId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id),
    rewardId: bigint({ mode: "number", unsigned: true })
        .references(() => rewards.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    type: varchar({ length: 50 }).notNull().default("info"), // reward_available, new_reward, etc.
    isRead: boolean().notNull().default(false),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: admin_notifications
// Historial persistente para administradores
// ============================================
export const adminNotifications = mysqlTable("admin_notifications", {
    id: serial().primaryKey(),
    type: varchar({ length: 50 }).notNull(), // new_client, points_added, new_redemption
    message: text().notNull(),
    isRead: boolean().notNull().default(false),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: client_groups
// Grupos de segmentación de clientes
// ============================================
export const clientGroups = mysqlTable("client_groups", {
    id: serial().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: client_group_members
// Relación muchos a muchos (Clientes <-> Grupos)
// ============================================
export const clientGroupMembers = mysqlTable("client_group_members", {
    id: serial().primaryKey(),
    groupId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clientGroups.id, { onDelete: 'cascade' }),
    clientId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id, { onDelete: 'cascade' }),
    createdAt: timestamp().defaultNow().notNull(),
});

// ============================================
// TABLA: referral_history
// Registro histórico de invitaciones exitosas
// ============================================
export const referralHistory = mysqlTable("referral_history", {
    id: serial().primaryKey(),
    referrerId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id, { onDelete: 'cascade' }),
    referredId: bigint({ mode: "number", unsigned: true })
        .notNull()
        .references(() => clients.id, { onDelete: 'cascade' }),
    pointsReferrer: int().notNull().default(0),
    pointsReferred: int().notNull().default(0),
    createdAt: timestamp().defaultNow().notNull(),
});
