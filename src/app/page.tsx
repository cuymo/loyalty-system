/**
ID: page_0002
Página raíz encargada de la redirección inicial basada en el estado de autenticación del cliente.
*/

import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getClientSession();

  if (session) {
    redirect("/client/home");
  } else {
    redirect("/login");
  }
}
