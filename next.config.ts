/**
ID: cfg_0002
Configuración principal de Next.js, definiendo el modo de salida standalone y paquetes externos del servidor.
*/

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["postgres", "bcryptjs"],
};

export default nextConfig;
