/**
 * drizzle.config.ts
 * Descripcion: Configuracion de Drizzle Kit para migraciones con MySQL
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
