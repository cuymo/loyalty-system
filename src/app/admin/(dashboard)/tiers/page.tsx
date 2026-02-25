/**
 * admin/tiers/page.tsx
 * Descripcion: Modulo para Administrar los Niveles VIP
 * Fecha de creacion: 2026-02-24
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/admin";
import { TiersClient } from "./tiers-client";

export default async function TiersPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const settingsList = await getSettings();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Niveles VIP</h1>
                <p className="text-muted-foreground mt-1">
                    Configura los puntos históricos requeridos para alcanzar cada Nivel VIP
                </p>
            </div>
            <TiersClient initialSettings={settingsList} />
        </div>
    );
}
