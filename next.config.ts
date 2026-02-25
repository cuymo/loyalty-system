/**
 * next.config.ts
 * Descripcion: Configuracion de Next.js para Crew Zingy
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2", "bcryptjs"],
};

export default nextConfig;
