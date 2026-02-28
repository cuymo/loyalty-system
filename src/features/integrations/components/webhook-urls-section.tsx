/**
 * components/webhook-urls-section.tsx
 * Descripcion: Panel de gestión de URLs múltiples de webhook
 */
"use client";

import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebhookUrlsSectionProps {
    webhookUrls: string[];
    onAddUrl: () => void;
    onRemoveUrl: (index: number) => void;
    onUpdateUrl: (index: number, value: string) => void;
    onSaveUrls: () => void;
    isLoading: boolean;
}

export function WebhookUrlsSection({
    webhookUrls,
    onAddUrl,
    onRemoveUrl,
    onUpdateUrl,
    onSaveUrls,
    isLoading,
}: WebhookUrlsSectionProps) {
    return (
        <div className="space-y-3 pt-2 pb-4 border-t border-b border-border">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                    URLs de Webhook
                </label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddUrl}
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
                            onChange={(e) => onUpdateUrl(index, e.target.value)}
                            placeholder="https://n8n.example.com/webhook/..."
                            className="flex-1 min-w-0 px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                        {webhookUrls.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveUrl(index)}
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
                onClick={onSaveUrls}
                disabled={isLoading}
                className="w-full sm:w-auto"
            >
                <Save size={16} className="mr-2" />
                Guardar URLs
            </Button>
        </div>
    );
}
