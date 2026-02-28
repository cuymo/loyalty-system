/**
ID: cfg_0001
Configuración central de Drizzle Kit para la gestión de migraciones y esquema de PostgreSQL.
*/

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    schema: "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
