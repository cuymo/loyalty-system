/**
 * components/typebot-section.tsx
 * Descripcion: Sección de configuración del enlace de Typebot
 */
"use client";

import { Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TypebotSectionProps {
    typebotUrl: string;
    onUrlChange: (url: string) => void;
    onSave: () => void;
    isLoading: boolean;
}

export function TypebotSection({ typebotUrl, onUrlChange, onSave, isLoading }: TypebotSectionProps) {
    return (
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
                        value={typebotUrl}
                        onChange={(e) => onUrlChange(e.target.value)}
                        placeholder="https://typebot.cuymo.com/my-typebot"
                        className="w-full px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
                <Button
                    onClick={onSave}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                >
                    <Save size={16} className="mr-2" />
                    Guardar URL
                </Button>
            </div>
        </div>
    );
}
