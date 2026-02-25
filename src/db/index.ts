/**
 * index.ts
 * Descripcion: Pool de conexion MySQL y exportacion de la instancia de Drizzle ORM
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { poolConnection: mysql.Pool };

const poolConnection = globalForDb.poolConnection || mysql.createPool({
    uri: process.env.DATABASE_URL!,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

if (process.env.NODE_ENV !== "production") {
    globalForDb.poolConnection = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: "default" });
