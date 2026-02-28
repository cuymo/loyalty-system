/**
 * admin/integrations/page.tsx
 * Descripcion: Modulo de Integraciones (Webhooks, Typebot, Documentacion interactiva)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/actions/admin";
import { getWebhookEvents } from "@/features/integrations/actions";
import { IntegrationsClient } from "./integrations-client";

export default async function IntegrationsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const events = await getWebhookEvents();
    const settings = await getSettings();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
                <p className="text-muted-foreground">
                    Configura webhooks, Typebot y consulta la documentacion
                </p>
            </div>
            <IntegrationsClient initialEvents={events} initialSettings={settings} />
        </div>
    );
}
