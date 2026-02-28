/**
 * components/referral-message-tab.tsx
 * Descripcion: Tab de configuración del mensaje de invitación para WhatsApp
 */
"use client";

import { Users, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralMessageTabProps {
    message: string;
    onMessageChange: (message: string) => void;
    onSave: () => void;
    isLoading: boolean;
}

export function ReferralMessageTab({ message, onMessageChange, onSave, isLoading }: ReferralMessageTabProps) {
    return (
        <div className="bg-card border rounded-xl overflow-hidden">
            <div className="p-4 md:p-6 border-b bg-muted/20">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-primary" /> Mensaje de Invitación</h3>
                <p className="text-sm text-muted-foreground mt-1">Plantilla que se precargará en WhatsApp cuando tu cliente pulse "Compartir".</p>
            </div>
            <div className="p-4 md:p-6 space-y-4">
                <textarea
                    rows={3}
                    value={message}
                    onChange={e => onMessageChange(e.target.value)}
                    placeholder="Ej. Únete a mi tienda y gana puntos: {{link}}"
                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">La palabra <b className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{`{{link}}`}</b> será reemplazada automáticamente por el enlace único del cliente.</p>

                <div className="pt-2">
                    <Button onClick={onSave} disabled={isLoading} className="w-full sm:w-auto mt-2">
                        <Save size={16} className="mr-2" />
                        {isLoading ? "Guardando..." : "Guardar Mensaje"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
