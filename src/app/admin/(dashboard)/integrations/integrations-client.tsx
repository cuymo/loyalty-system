/**
 * admin/integrations/integrations-client.tsx
 * Descripcion: Orquestador del módulo de Integraciones (Webhooks, Typebot, Documentación)
 * Refactorizado: 2026-02-28 — Fragmentado en subcomponentes
 */

"use client";

import { useState } from "react";
import { updateSetting } from "@/actions/admin";
import { updateWebhookEvent } from "@/features/integrations/actions";
import { useRouter } from "next/navigation";
import { Plug } from "lucide-react";
import { toast } from "@/lib/toast";
import type { WebhookEvent, Setting } from "@/types";

import { TypebotSection } from "@/features/integrations/components/typebot-section";
import { WebhookDocsButton, WebhookDocsModal } from "@/features/integrations/components/webhook-docs-modal";
import { WebhookUrlsSection } from "@/features/integrations/components/webhook-urls-section";
import { WebhookEventsList } from "@/features/integrations/components/webhook-events-list";

interface IntegrationsClientProps {
    initialEvents: WebhookEvent[];
    initialSettings: Setting[];
}

export function IntegrationsClient({
    initialEvents,
    initialSettings,
}: IntegrationsClientProps) {
    const router = useRouter();
    const [events, setEvents] = useState(initialEvents);
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [showDocs, setShowDocs] = useState(false);

    // Typebot URL State
    const typebotUrl = settings.find((s) => s.key === "typebot_url")?.value || "";

    const setTypebotUrl = (url: string) => {
        setSettings(
            settings.map((s) =>
                s.key === "typebot_url" ? { ...s, value: url } : s
            )
        );
    };

    const saveTypebotUrl = async () => {
        setIsLoading(true);
        try {
            await updateSetting("typebot_url", typebotUrl);
            toast.success("Guardado");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    // Multiple webhook URLs from JSON setting
    const getWebhookUrls = (): string[] => {
        const raw = settings.find((s) => s.key === "webhook_urls")?.value || "[]";
        try {
            const urls = JSON.parse(raw);
            return Array.isArray(urls) ? urls : [];
        } catch {
            return [];
        }
    };

    const [webhookUrls, setWebhookUrls] = useState<string[]>(() => {
        const urls = getWebhookUrls();
        if (urls.length === 0) {
            const oldUrl = settings.find((s) => s.key === "webhook_global_url")?.value;
            if (oldUrl) return [oldUrl];
        }
        return urls.length > 0 ? urls : [""];
    });

    const saveWebhookUrls = async () => {
        const filtered = webhookUrls.filter((u) => u.trim() !== "");
        setIsLoading(true);
        try {
            await updateSetting("webhook_urls", JSON.stringify(filtered));
            await updateSetting("webhook_global_url", filtered[0] || "");
            toast.success("URLs de webhook guardadas");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleEvent = async (id: number, isActive: boolean) => {
        setEvents(events.map(ev => ev.id === id ? { ...ev, isActive } : ev));
        setIsLoading(true);
        try {
            await updateWebhookEvent(id, { isActive });
            toast.success(isActive ? "Evento activado correctamente." : "Evento desactivado correctamente.");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Typebot Config */}
            <TypebotSection
                typebotUrl={typebotUrl}
                onUrlChange={setTypebotUrl}
                onSave={saveTypebotUrl}
                isLoading={isLoading}
            />

            {/* API Documentation */}
            <WebhookDocsButton onClick={() => setShowDocs(true)} />
            <WebhookDocsModal isOpen={showDocs} onClose={() => setShowDocs(false)} />

            {/* Webhook Events */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Plug size={20} className="text-success" />
                        <h2 className="text-lg font-semibold text-foreground">
                            Eventos y Webhooks
                        </h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Enviará todos los eventos activos a las URLs configuradas. Puedes agregar múltiples destinos.
                    </p>

                    <WebhookUrlsSection
                        webhookUrls={webhookUrls}
                        onAddUrl={() => setWebhookUrls([...webhookUrls, ""])}
                        onRemoveUrl={(i) => setWebhookUrls(webhookUrls.filter((_, idx) => idx !== i))}
                        onUpdateUrl={(i, v) => { const u = [...webhookUrls]; u[i] = v; setWebhookUrls(u); }}
                        onSaveUrls={saveWebhookUrls}
                        isLoading={isLoading}
                    />
                </div>

                <WebhookEventsList
                    events={events}
                    onToggleEvent={handleToggleEvent}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
