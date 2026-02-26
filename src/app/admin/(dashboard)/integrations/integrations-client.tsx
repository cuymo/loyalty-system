/**
 * admin/integrations/integrations-client.tsx
 * Descripcion: Componente cliente para configurar webhooks, ver Typebot y documentacion
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-22
 * Descripcion: Soporte para múltiples URLs de webhook, documentación con borde separador
 */

"use client";

import { useState } from "react";
import { updateWebhookEvent, updateSetting } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Plug, Globe, Save, BookOpen, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import type { WebhookEvent, Setting } from "@/types";
import { Button } from "@/components/ui/button";

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
    const [selectedDocEvent, setSelectedDocEvent] = useState<string>("cliente.registrado");

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
        // Migrate from old webhook_global_url if needed
        if (urls.length === 0) {
            const oldUrl = settings.find((s) => s.key === "webhook_global_url")?.value;
            if (oldUrl) return [oldUrl];
        }
        return urls.length > 0 ? urls : [""];
    });

    const saveWebhookUrls = async (urls: string[]) => {
        const filtered = urls.filter((u) => u.trim() !== "");
        setIsLoading(true);
        try {
            await updateSetting("webhook_urls", JSON.stringify(filtered));
            // Also keep old key in sync for backward compat
            await updateSetting("webhook_global_url", filtered[0] || "");
            toast.success("URLs de webhook guardadas");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    const addWebhookUrl = () => {
        setWebhookUrls([...webhookUrls, ""]);
    };

    const removeWebhookUrl = (index: number) => {
        setWebhookUrls(webhookUrls.filter((_, i) => i !== index));
    };

    const updateWebhookUrl = (index: number, value: string) => {
        const newUrls = [...webhookUrls];
        newUrls[index] = value;
        setWebhookUrls(newUrls);
    };

    const payloadExamples: Record<string, any> = {
        "cliente.registrado": { clientId: 1, phone: "0998765432", username: "usuario_test", avatarSvg: "avatar_01.svg", createdAt: "2026-02-22T07:00:00.000Z" },
        "cliente.otp_solicitado": { phone: "0998765432", expiresInMinutes: 5, attempt: 1, status: "pending" },
        "cliente.sesion_iniciada": { clientId: 1, phone: "0998765432", username: "usuario_test", points: 45, avatarSvg: "avatar_01.svg" },
        "cliente.puntos_sumados": { clientId: 1, username: "usuario_test", phone: "0998765432", code: "ZINGYM4XB3", pointsAdded: 15, batchName: "Lote Lunes", newTotalPoints: 60 },
        "cliente.canje_solicitado": { clientId: 1, username: "usuario_test", phone: "0998765432", rewardId: 5, rewardName: "Camiseta Premium", rewardType: "product", ticketUuid: "8f7e6d5c-4b3a-2a1b-9c8d-7e6f5a4b3c2d", pointsSpent: 100, remainingPoints: 25 },
        "cliente.canje_exitoso": { ticketUuid: "8f7e6d5c-4b3a-2a1b-9c8d-7e6f5a4b3c2d", clientId: 1, username: "usuario_test", phone: "0998765432", rewardId: 5, rewardName: "Camiseta Premium", pointsSpent: 100, status: "approved" },
        "cliente.canje_rechazado": { ticketUuid: "8f7e6d5c-4b3a-2a1b-9c8d-7e6f5a4b3c2d", clientId: 1, username: "usuario_test", phone: "0998765432", rewardId: 5, rewardName: "Camiseta Premium", pointsSpent: 100, reason: "Stock agotado", status: "rejected" },
        "cliente.cuenta_eliminada": { clientId: 1, phone: "0998765432", username: "usuario_test", deletedAt: "2026-02-23T22:00:00.000Z" },
        "cliente.cuenta_reactivada": { clientId: 1, phone: "0998765432", reactivatedAt: "2026-02-23T22:05:00.000Z" },
        "admin.premio_creado": { rewardId: 5, name: "Camiseta", description: "Camiseta edición especial", pointsRequired: 50, type: "product", status: "active" },
        "admin.lote_codigos_generado": { batchName: "Lote Lunes", quantity: 100, expirationDate: "2026-12-31T23:59:59Z", pointsValue: 15, prefix: "ZINGY", codeLength: 4 },
        "admin.notificacion_custom_whatsapp": { title: "¡Nuevo Descuento!", body: "Aprovecha 50% de descuento...", imageUrl: "https://ejemplo.com/img.jpg", targets: [{ id: 1, phone: "0998765432", username: "usuario_test", points: 45 }] },
        "admin.notificacion_masiva_premios": { rewardId: 5, rewardName: "Camiseta Premium", pointsRequired: 50, targets: [{ id: 1, phone: "0998765432", username: "usuario_test" }] },
        "admin.inicio_sesion": { adminId: 1, email: "admin@example.com", name: "Admin Zingy", timestamp: "2026-02-24T18:00:00.000Z" },
    };

    const eventDescriptions: Record<string, string> = {
        "cliente.registrado": "Nuevo cliente registrado (Solo si wantsTransactional=true)",
        "cliente.otp_solicitado": "Cliente solicita OTP (Siempre se envía)",
        "cliente.sesion_iniciada": "Sesión iniciada (Solo si wantsTransactional=true)",
        "cliente.puntos_sumados": "Suma puntos por QR (Solo si wantsTransactional=true)",
        "cliente.canje_solicitado": "Solicita premio (Solo si wantsTransactional=true)",
        "cliente.canje_exitoso": "Canje aprobado (Solo si wantsTransactional=true)",
        "cliente.canje_rechazado": "Canje rechazado (Solo si wantsTransactional=true)",
        "cliente.cuenta_eliminada": "Soft delete cuenta (Solo si wantsTransactional=true)",
        "cliente.cuenta_reactivada": "Cuenta reactivada (Solo si wantsTransactional=true)",
        "admin.premio_creado": "Nuevo premio creado en el catálogo",
        "admin.lote_codigos_generado": "Nuevo lote de códigos QR generado",
        "admin.notificacion_custom_whatsapp": "Mensaje personalizado enviado a clientes",
        "admin.notificacion_masiva_premios": "Notificación masiva de nuevo premio a clientes",
        "admin.inicio_sesion": "El administrador global inicia sesión",
    };

    const handleSaveEvent = async (
        id: number,
        data: { webhookUrl?: string; isActive?: boolean }
    ) => {
        setIsLoading(true);
        if (data.isActive !== undefined) {
            setEvents(events.map(ev => ev.id === id ? { ...ev, isActive: data.isActive! } : ev));
        }
        try {
            await updateWebhookEvent(id, data);
            if (data.isActive !== undefined) {
                if (data.isActive) {
                    toast.success("Evento activado correctamente.");
                } else {
                    toast.error("Evento desactivado correctamente.");
                }
            }
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSetting = async (key: string, value: string) => {
        setIsLoading(true);
        try {
            await updateSetting(key, value);
            toast.success("Guardado");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Typebot Section */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Globe size={20} className="text-info" />
                    <h2 className="text-lg font-semibold text-foreground">
                        Typebot
                    </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    Pega el enlace completo de tu bot para habilitar la burbuja de chat en la interfaz del cliente.
                </p>
                <div className="space-y-3 pt-2 border-t border-border overflow-hidden">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground">
                            URL de Typebot
                        </label>
                    </div>
                    <div className="space-y-2">
                        <input
                            value={settings.find((s) => s.key === "typebot_url")?.value || ""}
                            onChange={(e) =>
                                setSettings(
                                    settings.map((s) =>
                                        s.key === "typebot_url" ? { ...s, value: e.target.value } : s
                                    )
                                )
                            }
                            placeholder="https://typebot.cuymo.com/my-typebot"
                            className="w-full px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>
                    <Button
                        onClick={() =>
                            handleSaveSetting(
                                "typebot_url",
                                settings.find((s) => s.key === "typebot_url")?.value || ""
                            )
                        }
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        <Save size={16} className="mr-2" />
                        Guardar URL
                    </Button>
                </div>
            </div>

            {/* Documentation Section */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Documentacion de la API
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Referencia completa de eventos, payloads y ejemplos.
                        </p>
                    </div>
                </div>
                <div className="pt-2 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={() => setShowDocs(!showDocs)}
                        className="w-full sm:w-auto text-primary hover:text-primary/80 border-primary/20 hover:bg-primary/10"
                    >
                        {showDocs ? "Cerrar Docs" : "Ver Documentacion"}
                    </Button>
                </div>
            </div>

            {/* Docs Modal */}
            {showDocs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-4 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground">
                                Documentacion de Webhooks
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowDocs(false)}
                                className="text-muted-foreground"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="bg-warning/10 text-warning px-4 py-3 rounded-lg border border-warning/30 text-sm">
                            <strong>Nota Importante:</strong> Para proteger la privacidad, todos los webhooks informativos de clientes hacia WhatsApp están ahora condicionados y <strong>SOLO</strong> se dispararán hacia n8n si el cliente otorgó el permiso (<code>wantsTransactional</code> activado en su perfil). El <strong>único</strong> webhook incondicional es el de solicitar OTP. Todos los eventos quedan en el buzón In-App sin importar esta configuración.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm items-start overflow-hidden flex-1">
                            {/* Columna Izquierda: Eventos */}
                            <div className="space-y-3 h-full flex flex-col overflow-hidden">
                                <h3 className="text-foreground font-semibold flex items-center gap-2 shrink-0">
                                    Eventos Disponibles:
                                    <span className="text-muted-foreground font-normal text-xs">(Haz clic para ver schema)</span>
                                </h3>
                                <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                                    {[
                                        { event: "cliente.registrado", desc: "Nuevo cliente registrado via OTP" },
                                        { event: "cliente.otp_solicitado", desc: "Cliente solicita codigo OTP" },
                                        { event: "cliente.sesion_iniciada", desc: "Cliente inicia sesión exitosamente" },
                                        { event: "cliente.puntos_sumados", desc: "Cliente escanea código QR y suma puntos" },
                                        { event: "cliente.canje_solicitado", desc: "Cliente solicita canjear un premio" },
                                        { event: "cliente.canje_exitoso", desc: "Admin aprueba el canje" },
                                        { event: "cliente.canje_rechazado", desc: "Admin rechaza el canje" },
                                        { event: "cliente.cuenta_eliminada", desc: "Cliente elimina su cuenta" },
                                        { event: "cliente.cuenta_reactivada", desc: "Cuenta eliminada se reactiva" },
                                        { event: "admin.premio_creado", desc: "Nuevo premio creado en catálogo" },
                                        { event: "admin.lote_codigos_generado", desc: "Nuevo lote de códigos generado" },
                                        { event: "admin.notificacion_custom_whatsapp", desc: "Mensaje personalizado a clientes" },
                                        { event: "admin.notificacion_masiva_premios", desc: "Notificación masiva de nuevo premio" },
                                        { event: "admin.inicio_sesion", desc: "Inicio de sesión del admin" },
                                    ].map((e) => (
                                        <button
                                            key={e.event}
                                            onClick={() => setSelectedDocEvent(e.event)}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg text-left transition-all border shrink-0 ${selectedDocEvent === e.event
                                                ? "bg-primary/10 border-primary/30"
                                                : "bg-accent text-accent-foreground/50 border-border hover:bg-accent text-accent-foreground hover:border-border/80"
                                                }`}
                                        >
                                            <code className={`font-mono text-xs ${selectedDocEvent === e.event ? "text-primary" : "text-success"}`}>
                                                {e.event}
                                            </code>
                                            <span className="text-muted-foreground text-xs mt-1 sm:mt-0">
                                                {e.desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Columna Derecha: Payload y n8n (Sticky) */}
                            <div className="space-y-4 md:sticky md:top-0 h-fit overflow-y-auto max-h-full pr-1 custom-scrollbar">
                                <div className="bg-accent text-accent-foreground p-4 rounded-lg border border-border shadow-sm">
                                    <h3 className="text-foreground font-semibold mb-2">
                                        Formato de Payload: <span className="text-success font-mono text-xs bg-success/10 px-2 py-0.5 rounded">{selectedDocEvent}</span>
                                    </h3>
                                    <pre className="text-muted-foreground font-mono text-xs overflow-x-auto bg-background p-3 rounded-md">
                                        {JSON.stringify({
                                            event: selectedDocEvent,
                                            timestamp: new Date().toISOString(),
                                            data: payloadExamples[selectedDocEvent] || {}
                                        }, null, 2)}
                                    </pre>
                                </div>

                                <div className="bg-accent text-accent-foreground p-4 rounded-lg">
                                    <h3 className="text-foreground font-semibold mb-2">
                                        Ejemplo de n8n Webhook Node
                                    </h3>
                                    <p className="text-muted-foreground text-xs mb-2">
                                        Configura un nodo Webhook en n8n con metodo POST y pega la URL
                                        generada en el campo de URL de cada evento de abajo.
                                    </p>
                                    <a
                                        href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-info text-xs hover:underline"
                                    >
                                        Documentacion de n8n Webhooks
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Webhook Events List */}
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

                    {/* Multiple Webhook URLs */}
                    <div className="space-y-3 pt-2 pb-4 border-t border-b border-border">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">
                                URLs de Webhook
                            </label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addWebhookUrl}
                                className="text-success hover:text-success/80 border-success/20 hover:bg-success/10"
                            >
                                <Plus size={14} className="mr-1.5" />
                                Agregar URL
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {webhookUrls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        value={url}
                                        onChange={(e) => updateWebhookUrl(index, e.target.value)}
                                        placeholder="https://n8n.example.com/webhook/..."
                                        className="flex-1 min-w-0 px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                    {webhookUrls.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeWebhookUrl(index)}
                                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            title="Eliminar URL"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={() => saveWebhookUrls(webhookUrls)}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            <Save size={16} className="mr-2" />
                            Guardar URLs
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries({
                        "Eventos de Cliente": events.filter(e => e.eventName.startsWith("cliente.")),
                        "Eventos de Administrador": events.filter(e => e.eventName.startsWith("admin.")),
                        "Eventos del Sistema": events.filter(e => e.eventName.startsWith("sistema.") || (!e.eventName.startsWith("cliente.") && !e.eventName.startsWith("admin.")))
                    }).map(([category, categoryEvents]) => {
                        if (categoryEvents.length === 0) return null;
                        return (
                            <div key={category} className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground/80 flex items-center mb-1">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs mr-2">{categoryEvents.length}</span>
                                    {category}
                                </h3>
                                {categoryEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="bg-background border border-border rounded-lg p-3 md:p-4 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0 pr-4">
                                            <code className="text-success font-mono text-xs md:text-sm truncate block mb-1">
                                                {event.eventName}
                                            </code>
                                            <p className="text-xs text-muted-foreground truncate hidden md:block">
                                                {eventDescriptions[event.eventName] || "Evento del sistema"}
                                            </p>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                                {event.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleSaveEvent(event.id, { isActive: !event.isActive })
                                                }
                                                className={`w-11 h-6 rounded-full transition-all flex items-center relative shrink-0 ${event.isActive ? "bg-success" : "bg-muted"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-4 h-4 bg-card rounded-full transition-transform absolute left-1 ${event.isActive ? "translate-x-5" : "translate-x-0"
                                                        }`}
                                                />
                                            </button>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
