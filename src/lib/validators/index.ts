/**
 * validators/index.ts
 * Descripcion: Esquemas de validacion Zod compartidos entre cliente y servidor
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { z } from "zod";

// Validacion de telefono ecuatoriano (10 digitos)
export const phoneSchema = z
    .string()
    .length(10, "El numero debe tener exactamente 10 digitos")
    .regex(/^\d{10}$/, "Solo se permiten digitos");

// Validacion de OTP (6 digitos)
export const otpSchema = z
    .string()
    .length(6, "El codigo debe tener 6 digitos")
    .regex(/^\d{6}$/, "Solo se permiten digitos");

// Validacion de nombre de usuario
export const usernameSchema = z
    .string()
    .min(3, "Minimo 3 caracteres")
    .max(50, "Maximo 50 caracteres")
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "Solo letras, numeros y guion bajo"
    );

// Validacion de login de admin
export const adminLoginSchema = z.object({
    email: z.string().email("Correo electronico invalido"),
    password: z.string().min(6, "Minimo 6 caracteres"),
});

// Validacion de premio
export const rewardSchema = z.object({
    name: z.string().min(1, "Nombre requerido").max(255),
    description: z.string().optional(),
    pointsRequired: z.number().int().positive("Debe ser un entero positivo"),
    type: z.enum(["discount", "product"]),
    status: z.enum(["active", "inactive"]).default("active"),
});

// Validacion de campana
export const campaignSchema = z.object({
    name: z.string().min(1, "Nombre requerido").max(255),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    status: z.enum(["active", "inactive"]).default("active"),
});

// Validacion de generacion de codigos
export const codeGeneratorSchema = z.object({
    prefix: z.string().min(1).max(10),
    quantity: z.number().int().min(1).max(10000),
    campaignId: z.number().int().positive(),
    codeLength: z.number().int().min(4).max(20).default(6),
    batchName: z.string().min(1).max(100),
    pointsValue: z.number().int().positive().default(1),
});
