/**
 * admin/integrations/page.tsx
 * Descripcion: Modulo de Integraciones (Webhooks, Typebot, Documentacion interactiva)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWebhookEvents, getSettings } from "@/actions/admin";
import { IntegrationsClient } from "./integrations-client";

export default async function IntegrationsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const events = await getWebhookEvents();
    const settings = await getSettings();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Integraciones</h1>
                <p className="text-muted-foreground mt-1">
                    Configura webhooks, Typebot y consulta la documentacion
                </p>
            </div>
            <IntegrationsClient initialEvents={events} initialSettings={settings} />
        </div>
    );
}
