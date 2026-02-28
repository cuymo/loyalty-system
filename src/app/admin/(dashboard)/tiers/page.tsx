/**
 * admin/tiers/page.tsx
 * Descripcion: Modulo para Administrar los Niveles VIP
 * Fecha de creacion: 2026-02-24
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/features/admin/settings/actions/admin-settings";
import { TiersClient } from "./tiers-client";

export default async function TiersPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const settingsList = await getSettings();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Niveles VIP</h1>
                <p className="text-muted-foreground">
                    Configura los puntos históricos requeridos para alcanzar cada Nivel VIP
                </p>
            </div>
            <TiersClient initialSettings={settingsList} />
        </div>
    );
}
