/**
 * types/index.ts
 * Descripcion: Interfaces y tipos globales de TypeScript para Crew Zingy
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import type { InferSelectModel } from "drizzle-orm";
import type {
    admins,
    clients,
    rewards,
    codes,
    redemptions,
    settings,
    webhookEvents,
} from "@/db/schema";

// Tipos inferidos de las tablas de Drizzle
export type Admin = InferSelectModel<typeof admins>;
export type Client = InferSelectModel<typeof clients>;
export type Reward = InferSelectModel<typeof rewards>;
export type Code = InferSelectModel<typeof codes>;
export type Redemption = InferSelectModel<typeof redemptions>;
export type Setting = InferSelectModel<typeof settings>;
export type WebhookEvent = InferSelectModel<typeof webhookEvents>;

// Tipos para respuestas de API
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Tipos para webhooks
export interface WebhookPayload {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
}
