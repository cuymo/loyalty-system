/**
 * admin/clients/page.tsx
 * Descripcion: Modulo de Clientes con listado, detalle, WhatsApp y comprobador antifraude
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClients, getPendingRedemptions } from "@/actions/admin";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const clientsList = await getClients();
    const pendingRedemptions = await getPendingRedemptions();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clientes y Canjes</h1>
                <p className="text-muted-foreground mt-1">
                    Visualiza y gestiona los clientes registrados y aprueba los canjes pendientes
                </p>
            </div>
            <ClientsClient initialClients={clientsList} initialPendingRedemptions={pendingRedemptions} />
        </div>
    );
}
