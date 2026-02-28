/**
ID: db_0001
Definición detallada del esquema de PostgreSQL utilizando Drizzle ORM, incluyendo tablas, enums e índices.

NOTA IMPORTANTE: Este archivo define el esquema base. Para integridad completa, los siguientes CHECKs y 
TRIGGERS se deben aplicar en migraciones SQL puras (no en Drizzle ORM):

CONSTRAINTS FALTANTES (Aplicar con migraciones SQL):
- clients: CONSTRAINT chk_points_non_negative CHECK (points >= 0 AND lifetime_points >= 0)
- clients: CONSTRAINT chk_phone_numeric CHECK (phone ~ '^[0-9]+$')
- clients: CONSTRAINT chk_login_count_non_negative CHECK (login_count >= 0)
- rewards: CONSTRAINT chk_points_required_positive CHECK (points_required > 0)
- rewards: CONSTRAINT chk_stock_non_negative CHECK (stock IS NULL OR stock >= 0)
- redemptions: CONSTRAINT chk_points_spent_positive CHECK (points_spent > 0)
- webhookEvents: CONSTRAINT chk_webhook_url_format CHECK (webhook_url IS NULL OR webhook_url ~ '^https?://')
- referralHistory: CONSTRAINT chk_referral_points_non_negative CHECK (points_referrer >= 0 AND points_referred >= 0)
- referralHistory: CONSTRAINT chk_referral_not_self CHECK (referrer_id != referred_id)
- campaignsHistory: CONSTRAINT chk_campaign_counts_non_negative CHECK (points_gifted >= 0 AND recipients_count >= 0)
- pointTransactions: CONSTRAINT chk_transaction_amount_not_zero CHECK (amount != 0)

TRIGGERS FALTANTES (Aplicar con migraciones SQL):
- update_updated_at_column() function + triggers para admins, clients, rewards, redemptions, webhookEvents, clientGroups
- reduce_reward_stock_on_approval() function + trigger para decrementar stock en redemptions aprobadas
*/

import {
    pgTable,
    varchar,
    integer,
    bigint,
    text,
    boolean,
    timestamp,
    pgEnum,
    serial,
    date,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";

/**
ID: db_0002
Enums para tipado estricto de estados y categorías en la base de datos.
*/
export const tierEnum = pgEnum("required_tier", ["none", "bronze", "silver", "gold", "vip"]);
export const rewardTypeEnum = pgEnum("reward_type", ["discount", "product", "credit"]);
export const rewardStatusEnum = pgEnum("reward_status", ["active", "inactive", "out_of_stock"]);
export const redemptionStatusEnum = pgEnum("redemption_status", ["pending", "approved", "rejected"]);
export const notificationTypeEnum = pgEnum("notification_type", ["campaign_only_text", "campaign_with_image", "campaign_with_points", "reward_available", "new_reward", "points_earned", "points_spent"]);
export const pointTransactionReasonEnum = pgEnum("point_transaction_reason", ["purchase", "admin_assigned", "redemption_in_reward", "referral_bonus", "campaign_gift", "refund", "code_claim"]);
export const codeStatusEnum = pgEnum("code_status", ["unused", "used", "expired"]);

/**
ID: db_0003
Definición de las tablas principales del sistema.
*/

export const admins = pgTable("admins", {
    id: serial().primaryKey(),
    email: varchar({ length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar({ length: 100 }).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_admins_email").on(t.email),
]);

export const clients = pgTable("clients", {
    id: serial().primaryKey(),
    phone: varchar({ length: 15 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull().unique(),
    username: varchar({ length: 50 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    avatarSvg: varchar("avatar_svg", { length: 100 }).notNull().default("default.svg"),
    birthDate: date("birth_date"),
    points: bigint({ mode: "number" }).notNull().default(0),
    lifetimePoints: bigint("lifetime_points", { mode: "number" }).notNull().default(0),
    referralCount: integer("referral_count").notNull().default(0),
    referredBy: bigint("referred_by", { mode: "number" }), // Foreign Key se declara en las relaciones o manualmente en migraciones si Drizzle no auto-resuelve recursivos aquí fácilmente
    wantsMarketing: boolean("wants_marketing").notNull().default(true),
    wantsTransactional: boolean("wants_transactional").notNull().default(true),
    wantsSecurity: boolean("wants_security").notNull().default(true),
    wantsInWhatsapp: boolean("wants_in_whatsapp").notNull().default(true),
    wantsInEmail: boolean("wants_in_email").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    lastLoginAt: timestamp("last_login_at"),
    loginCount: integer("login_count").notNull().default(0),
    isBlocked: boolean("is_blocked").notNull().default(false),
    blockReason: text("block_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_clients_phone").on(t.phone),
    index("idx_clients_email").on(t.email),
    index("idx_clients_username").on(t.username),
    index("idx_clients_points").on(t.points),
    index("idx_clients_lifetime_points").on(t.lifetimePoints),
    index("idx_clients_is_blocked").on(t.isBlocked),
    index("idx_clients_deleted_at").on(t.deletedAt),
    index("idx_clients_referral").on(t.referredBy),
]);

export const rewards = pgTable("rewards", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    imageUrl: text("image_url").array().default([]), // Arrays text[]
    pointsRequired: integer("points_required").notNull(),
    requiredTier: tierEnum("required_tier").notNull().default("none"),
    type: rewardTypeEnum().notNull(),
    status: rewardStatusEnum().notNull().default("active"),
    stock: integer(), // NULL significa inventario infinito
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_rewards_status").on(t.status),
    index("idx_rewards_type").on(t.type),
    index("idx_rewards_points_required").on(t.pointsRequired),
]);

export const redemptions = pgTable("redemptions", {
    id: serial().primaryKey(),
    clientId: bigint("client_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    rewardId: bigint("reward_id", { mode: "number" }).notNull().references(() => rewards.id, { onDelete: "cascade" }),
    ticketUuid: varchar("ticket_uuid", { length: 36 }).notNull().unique(), // default uuid_generate_v4() handled via raw DB logic o en app
    pointsSpent: integer("points_spent").notNull(),
    status: redemptionStatusEnum().notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedByAdminId: bigint("reviewed_by_admin_id", { mode: "number" }).references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_redemptions_client_id").on(t.clientId),
    index("idx_redemptions_reward_id").on(t.rewardId),
    index("idx_redemptions_status").on(t.status),
    index("idx_redemptions_ticket_uuid").on(t.ticketUuid),
]);

export const webhookEvents = pgTable("webhook_events", {
    id: serial().primaryKey(),
    eventName: varchar("event_name", { length: 100 }).notNull().unique(),
    description: text(),
    webhookUrl: varchar("webhook_url", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_webhook_events_is_active").on(t.isActive),
]);

export const nameChangesHistory = pgTable("name_changes_history", {
    id: serial().primaryKey(),
    clientId: bigint("client_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    oldNames: text("old_names").array().notNull(),
    newName: varchar("new_name", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appNotifications = pgTable("app_notifications", {
    id: serial().primaryKey(),
    clientId: bigint("client_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    rewardId: bigint("reward_id", { mode: "number" }).references(() => rewards.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    imageUrl: text("image_url").array().default([]),
    type: notificationTypeEnum().notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_app_notifications_client_id").on(t.clientId),
    index("idx_app_notifications_is_read").on(t.isRead),
    index("idx_app_notifications_created_at").on(t.createdAt),
]);

export const adminNotifications = pgTable("admin_notifications", {
    id: serial().primaryKey(),
    adminId: bigint("admin_id", { mode: "number" }).references(() => admins.id, { onDelete: "cascade" }),
    type: varchar({ length: 50 }).notNull(),
    message: text().notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_admin_notifications_admin_id").on(t.adminId),
    index("idx_admin_notifications_is_read").on(t.isRead),
]);

export const clientGroups = pgTable("client_groups", {
    id: serial().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    description: text(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
    index("idx_client_groups_deleted_at").on(t.deletedAt),
]);

export const clientGroupMembers = pgTable("client_group_members", {
    id: serial().primaryKey(),
    groupId: bigint("group_id", { mode: "number" }).notNull().references(() => clientGroups.id, { onDelete: "cascade" }),
    clientId: bigint("client_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_client_group_members_group_id").on(t.groupId),
    index("idx_client_group_members_client_id").on(t.clientId),
    // Constraint único para evitar duplicados: un cliente no puede estar dos veces en el mismo grupo
    uniqueIndex("uk_group_member").on(t.groupId, t.clientId),
]);

export const codes = pgTable("codes", {
    id: serial().primaryKey(),
    code: varchar({ length: 50 }).notNull().unique(),
    status: codeStatusEnum().notNull().default("unused"),
    pointsValue: integer("points_value").notNull(),
    batchName: varchar("batch_name", { length: 100 }).notNull(),
    expirationDate: timestamp("expiration_date").notNull(),
    usedAt: timestamp("used_at"),
    usedBy: bigint("used_by", { mode: "number" }).references(() => clients.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_codes_batch_name").on(t.batchName),
    index("idx_codes_status").on(t.status),
    // Índice para búsquedas rápidas por código único
    index("idx_codes_code").on(t.code),
]);

export const referralHistory = pgTable("referral_history", {
    id: serial().primaryKey(),
    referrerId: bigint("referrer_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    referredId: bigint("referred_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    pointsReferrer: integer("points_referrer").notNull().default(0),
    pointsReferred: integer("points_referred").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_referral_history_referrer_id").on(t.referrerId),
    index("idx_referral_history_referred_id").on(t.referredId),
    // Índice compuesto para auditorías rápidas de referidos
    index("idx_referral_history_pair").on(t.referrerId, t.referredId),
]);

export const campaignsHistory = pgTable("campaigns_history", {
    id: serial().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    body: text().notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    pointsGifted: integer("points_gifted").notNull().default(0),
    recipientsCount: integer("recipients_count").notNull().default(0),
    sentViaWhatsapp: boolean("sent_via_whatsapp").notNull().default(false),
    sentViaEmail: boolean("sent_via_email").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("idx_campaigns_history_created_at").on(t.createdAt),
]);

export const pointTransactions = pgTable("point_transactions", {
    id: serial().primaryKey(),
    clientId: bigint("client_id", { mode: "number" }).notNull().references(() => clients.id, { onDelete: "cascade" }),
    amount: bigint({ mode: "number" }).notNull(),
    reason: pointTransactionReasonEnum().notNull(),
    referenceId: bigint("reference_id", { mode: "number" }),
    balanceAfter: bigint("balance_after", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdByAdminId: bigint("created_by_admin_id", { mode: "number" }).references(() => admins.id, { onDelete: "set null" }),
}, (t) => [
    index("idx_point_transactions_client_id").on(t.clientId),
    index("idx_point_transactions_reason").on(t.reason),
    index("idx_point_transactions_created_at").on(t.createdAt),
    // Índice compuesto para auditorías: historial de transacciones de un cliente
    index("idx_point_transactions_client_created").on(t.clientId, t.createdAt),
]);
