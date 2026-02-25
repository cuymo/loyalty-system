/**
 * app/page.tsx
 * Descripcion: Pagina raiz - redirige a /home si autenticado, o /login si no
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getClientSession();

  if (session) {
    redirect("/home");
  } else {
    redirect("/login");
  }
}
