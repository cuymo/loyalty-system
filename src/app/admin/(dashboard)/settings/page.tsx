/**
 * admin/settings/page.tsx
 * Descripcion: Pagina de Ajustes con configuracion global y Danger Zone
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/admin";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const settingsList = await getSettings();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Ajustes</h1>
                <p className="text-muted-foreground mt-1">
                    Configuracion global de la plataforma
                </p>
            </div>
            <SettingsClient initialSettings={settingsList} />
        </div>
    );
}
