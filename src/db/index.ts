/**
ID: db_0004
Instanciación y exportación del cliente de base de datos PostgreSQL y el ORM Drizzle con soporte para singleton en desarrollo.
*/

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sql: postgres.Sql };

const sql = globalForDb.sql || postgres(process.env.DATABASE_URL!, { max: 10 });

if (process.env.NODE_ENV !== "production") {
    globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });
