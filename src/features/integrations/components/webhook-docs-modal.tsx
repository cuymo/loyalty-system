/**
 * components/webhook-docs-modal.tsx
 * Descripcion: Modal interactivo de documentación de la API de webhooks
 */
"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const docEvents = [
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
];

interface WebhookDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WebhookDocsButton({ onClick }: { onClick: () => void }) {
    return (
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
                    onClick={onClick}
                    className="w-full sm:w-auto text-primary hover:text-primary/80 border-primary/20 hover:bg-primary/10"
                >
                    Ver Documentacion
                </Button>
            </div>
        </div>
    );
}

export function WebhookDocsModal({ isOpen, onClose }: WebhookDocsModalProps) {
    const [selectedDocEvent, setSelectedDocEvent] = useState<string>("cliente.registrado");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">
                        Documentacion de Webhooks
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-muted-foreground"
                    >
                        <X size={20} />
                    </Button>
                </div>

                <div className="bg-warning/10 text-warning px-4 py-3 rounded-lg border border-warning/30 text-sm">
                    <strong>Nota Importante:</strong> Para proteger la privacidad, todos los webhooks informativos de clientes hacia WhatsApp están ahora condicionados y <strong>SOLO</strong> se dispararán hacia n8n si el cliente otorgó el permiso (<code>wantsTransactional</code> activado en su perfil). El <strong>único</strong> webhook incondicional es el de solicitar OTP. Todos los eventos quedan en el buzón In-App sin importar esta configuración.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm items-start overflow-hidden flex-1">
                    {/* Left Column: Events */}
                    <div className="space-y-3 h-full flex flex-col overflow-hidden">
                        <h3 className="text-foreground font-semibold flex items-center gap-2 shrink-0">
                            Eventos Disponibles:
                            <span className="text-muted-foreground font-normal text-xs">(Haz clic para ver schema)</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                            {docEvents.map((e) => (
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

                    {/* Right Column: Payload and n8n */}
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
    );
}
