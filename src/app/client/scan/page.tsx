/**
 * (client)/scan/page.tsx
 * Descripcion: Pagina para ingresar codigos QR manualmente y sumar puntos (server wrapper)
 */

import { ScanClient } from "@/features/clients/components/scan/scan-client";
import { getClientProfile } from "@/actions/client";
import { redirect } from "next/navigation";

export default async function ScanPage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    return <ScanClient />
}
