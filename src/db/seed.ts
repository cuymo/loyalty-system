/**
 * seed.ts
 * Descripcion: Script para crear el primer administrador en la base de datos
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * 
 * Ejecucion: npx tsx src/db/seed.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { admins, webhookEvents, settings } from "./schema";

async function seed() {
    console.log("Conectando a la base de datos...");

    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL!,
    });

    const db = drizzle(connection);

    // --- Seed Admin ---
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@zingystore.com";
    const rawPassword = process.env.INITIAL_ADMIN_PASSWORD || "&JU4mx_4fYh7Tv7*";
    const adminPassword = await bcrypt.hash(rawPassword, 12);

    console.log("Creando administrador único global...");
    await db
        .insert(admins)
        .values({
            id: 1, // Enforce strict ID 1
            email: adminEmail,
            password: adminPassword,
            name: "Admin Zingy",
        })
        .onDuplicateKeyUpdate({ set: { email: adminEmail, password: adminPassword, name: "Admin Zingy" } });

    // Destrucción de Intrusos: Eliminar a cualquier otro administrador inyectado
    const deletedAdmins = await db.delete(admins).where(sql`id != 1`);
    if (deletedAdmins[0].affectedRows > 0) {
        console.warn(`\n  [ALERTA] Se eliminaron ${deletedAdmins[0].affectedRows} administradores intrusos de la base de datos.`);
    }

    console.log(`  Admin único creado/actualizado: ${adminEmail} / ${rawPassword}`);

    // --- Seed Webhook Events ---
    console.log("Registrando eventos de webhook...");
    const events = [
        "cliente.registrado",
        "cliente.otp_solicitado",
        "cliente.sesion_iniciada",
        "cliente.perfil_actualizado",
        "cliente.puntos_sumados",
        "cliente.canje_solicitado",
        "cliente.canje_exitoso",
        "cliente.canje_rechazado",
        "cliente.error_codigo_invalido",
        "cliente.cuenta_eliminada",
        "cliente.cuenta_reactivada",
        "admin.premio_creado",
        "admin.premio_modificado",
        "admin.lote_codigos_generado",
        "admin.notificacion_custom_whatsapp",
        "admin.notificacion_masiva_premios",
        "admin.inicio_sesion",
        "sistema.danger_zone_activada",
        "cliente.nivel_alcanzado",
        "cliente.referido",
        "cliente.cumpleanos_celebrado",
        "cliente.cuenta_bloqueada",
    ];

    for (const eventName of events) {
        await db
            .insert(webhookEvents)
            .values({ eventName, webhookUrl: null, isActive: false })
            .onDuplicateKeyUpdate({ set: { eventName } });
    }

    console.log(`  ${events.length} eventos registrados.`);

    // --- Seed Settings ---
    console.log("Configurando ajustes por defecto...");
    const defaultSettings = [
        { key: "client_notice", value: "Bienvenido a Crew Zingy" },
        { key: "points_expiration_days", value: "365" },
        { key: "typebot_id", value: process.env.NEXT_PUBLIC_TYPEBOT_ID || "" },
        {
            key: "typebot_api_host",
            value: process.env.NEXT_PUBLIC_TYPEBOT_API_HOST || "",
        },
        { key: "tier_bronze_points", value: "100" },
        { key: "tier_silver_points", value: "500" },
        { key: "tier_gold_points", value: "1000" },
        { key: "tier_vip_points", value: "5000" },
        { key: "referral_bonus_referrer", value: "50" },
        { key: "referral_bonus_referred", value: "50" },
        { key: "referral_max_limit", value: "5" },
        { key: "birthday_bonus_points", value: "200" },
    ];

    for (const setting of defaultSettings) {
        await db
            .insert(settings)
            .values(setting)
            .onDuplicateKeyUpdate({ set: { value: setting.value } });
    }

    console.log("  Ajustes registrados.\n");
    console.log("Seed completado exitosamente.");
    console.log("Credenciales de Admin:");
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${rawPassword}`);
    console.log("\nCAMBIA estas credenciales en produccion!\n");

    await connection.end();
    process.exit(0);
}

seed().catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
});
