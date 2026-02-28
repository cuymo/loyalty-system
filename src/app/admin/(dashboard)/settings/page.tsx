/**
 * admin/settings/page.tsx
 * Descripcion: Pagina de Ajustes con configuracion global y Danger Zone
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/features/admin/settings/actions/admin-settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const settingsList = await getSettings();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
                <p className="text-muted-foreground">
                    Configuracion global de la plataforma
                </p>
            </div>
            <SettingsClient initialSettings={settingsList} />
        </div>
    );
}
