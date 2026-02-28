/**
 * components/webhook-events-list.tsx
 * Descripcion: Lista categorizada de eventos webhook con toggles de activación
 */
"use client";

import type { WebhookEvent } from "@/types";

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

interface WebhookEventsListProps {
    events: WebhookEvent[];
    onToggleEvent: (id: number, isActive: boolean) => void;
    isLoading: boolean;
}

export function WebhookEventsList({ events, onToggleEvent, isLoading }: WebhookEventsListProps) {
    const categories = {
        "Eventos de Cliente": events.filter(e => e.eventName.startsWith("cliente.")),
        "Eventos de Administrador": events.filter(e => e.eventName.startsWith("admin.")),
        "Eventos del Sistema": events.filter(e => e.eventName.startsWith("sistema.") || (!e.eventName.startsWith("cliente.") && !e.eventName.startsWith("admin."))),
    };

    return (
        <div className="space-y-6">
            {Object.entries(categories).map(([category, categoryEvents]) => {
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
                                        onClick={() => onToggleEvent(event.id, !event.isActive)}
                                        disabled={isLoading}
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
    );
}
