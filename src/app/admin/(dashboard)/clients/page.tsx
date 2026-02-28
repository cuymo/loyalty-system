/**
 * admin/clients/page.tsx
 * Descripcion: Modulo de Clientes con listado, detalle, WhatsApp y comprobador antifraude
 * Fecha de creacion: 2026-02-21
 * Refactorizado: 2026-02-28 — Migrado a shadcn Cards
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClients } from "@/features/admin/clients/actions/admin-clients";
import { getPendingRedemptions } from "@/features/admin/redemptions/actions/admin-redemptions";
import { ClientsClient } from "./clients-client";

export default async function ClientsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const clientsList = await getClients();
    const pendingRedemptions = await getPendingRedemptions();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Clientes y Canjes</h1>
                <p className="text-muted-foreground">
                    Visualiza y gestiona los clientes registrados y aprueba los canjes pendientes
                </p>
            </div>
            <ClientsClient initialClients={clientsList} initialPendingRedemptions={pendingRedemptions} />
        </div>
    );
}
