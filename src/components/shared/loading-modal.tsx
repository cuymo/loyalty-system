/**
 * components/shared/loading-modal.tsx
 * Descripcion: Modal de carga flotante que bloquea interacciones durante operaciones criticas
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

interface LoadingModalProps {
    isOpen: boolean;
    message?: string;
}

export function LoadingModal({
    isOpen,
    message = "Procesando...",
}: LoadingModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center space-y-4">
                <div className="w-10 h-10 border-4 border-border border-t-foreground rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm font-medium">{message}</p>
            </div>
        </div>
    );
}
