/**
 * (client)/scan/page.tsx
 * Descripcion: Pagina para ingresar codigos QR manualmente y sumar puntos (server wrapper)
 */

import { ScanClient } from "@/features/client/scan/components/scan-client";
import { getClientProfile } from "@/features/client/profile/actions/client-profile";
import { redirect } from "next/navigation";

export default async function ScanPage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    return <ScanClient />
}
