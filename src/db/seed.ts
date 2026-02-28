/**
ID: db_0005
Script de inicialización de datos (Seed) para crear el administrador maestro y los eventos de webhook base.
*/

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { admins, webhookEvents } from "./schema";

async function seed() {
    console.log("Conectando a la base de datos...");

    const sqlClient = postgres(process.env.DATABASE_URL!, { max: 1 });
    const db = drizzle(sqlClient);

    /**
    ID: db_0006
    Lógica de creación o actualización del administrador inicial basado en variables de entorno.
    */
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const rawPassword = process.env.INITIAL_ADMIN_PASSWORD;

    if (!adminEmail || !rawPassword) {
        console.error("❌ ERROR: Para inicializar la BD necesitas proveer INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD en tu .env");
        process.exit(1);
    }

    const adminPassword = await bcrypt.hash(rawPassword, 12);

    console.log("Creando administrador único global...");
    await db
        .insert(admins)
        .values({
            email: adminEmail,
            passwordHash: adminPassword,
            name: "Admin Zingy",
            firstName: "Admin",
            lastName: "Zingy",
        })
        .onConflictDoUpdate({ target: admins.email, set: { name: "Admin Zingy", firstName: "Admin", lastName: "Zingy" } });

    // Destrucción de Intrusos: Eliminar a cualquier otro administrador inyectado
    const deletedAdmins = await db.delete(admins).where(sql`id != 1`).returning();
    if (deletedAdmins.length > 0) {
        console.warn(`\n  [ALERTA] Se eliminaron ${deletedAdmins.length} administradores intrusos de la base de datos.`);
    }

    console.log(`  Admin verificado exitosamente.`);

    /**
    ID: db_0007
    Registro de los eventos de webhook disponibles en el sistema para su posterior configuración.
    */
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
            .onConflictDoUpdate({ target: webhookEvents.eventName, set: { eventName } });
    }

    console.log(`  ${events.length} eventos registrados.`);

    console.log("Seed completado exitosamente.");


    await sqlClient.end();
    process.exit(0);
}

seed().catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
});
