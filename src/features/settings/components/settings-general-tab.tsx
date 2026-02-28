/**
 * components/settings-general-tab.tsx
 * Descripcion: Tab General de ajustes (Settings Cards + Danger Zone)
 */
"use client";

import { useState } from "react";
import { Save, AlertTriangle, Gift, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Setting } from "@/types";

const settingLabels: Record<string, string> = {
    client_notice: "Aviso para Clientes (Obsoleto, usar los de abajo)",
    notice_auth: "Aviso a clientes (iniciados sesión)",
    notice_guest: "Aviso a clientes (invitados)",
    birthday_bonus_points: "Puntos de Regalo por Cumpleaños",
};

interface SettingsGeneralTabProps {
    settings: Setting[];
    onSettingsChange: (settings: Setting[]) => void;
    onSave: (key: string, value: string) => void;
    onDangerZone: () => void;
    isLoading: boolean;
}

export function SettingsGeneralTab({
    settings,
    onSettingsChange,
    onSave,
    onDangerZone,
    isLoading,
}: SettingsGeneralTabProps) {
    const [showDangerConfirm, setShowDangerConfirm] = useState(false);
    const [dangerText, setDangerText] = useState("");

    const filteredSettings = settings.filter(
        (s) =>
            s.key !== "typebot_id" &&
            s.key !== "typebot_api_host" &&
            s.key !== "typebot_url" &&
            s.key !== "webhook_urls" &&
            s.key !== "webhook_global_url" &&
            s.key !== "client_notice" &&
            s.key !== "admin_alert_preferences" &&
            s.key !== "points_expiration_days" &&
            !s.key.startsWith("tier_") &&
            !s.key.startsWith("ref_") &&
            !s.key.startsWith("referral_")
    );

    const messageSettings = filteredSettings.filter(s => ["notice_auth", "notice_guest"].includes(s.key));
    const rewardSettings = filteredSettings.filter(s => ["birthday_bonus_points"].includes(s.key));
    const otherSettings = filteredSettings.filter(s => !messageSettings.includes(s) && !rewardSettings.includes(s));

    const handleDangerConfirm = () => {
        if (dangerText !== "ELIMINAR TODO") return;
        onDangerZone();
        setShowDangerConfirm(false);
        setDangerText("");
    };

    const renderSetting = (setting: Setting) => (
        <Card key={setting.key} className="border-border shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold text-foreground">
                    {settingLabels[setting.key] || setting.key}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col gap-4">
                {(setting.key === "notice_auth" || setting.key === "notice_guest") ? (
                    <textarea
                        value={setting.value || ""}
                        onChange={(e) => onSettingsChange(settings.map((s) => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                        rows={3}
                        placeholder={`Escribe aquí el ${settingLabels[setting.key]?.toLowerCase() || 'aviso'}`}
                        className="w-full h-full min-h-[100px] px-4 py-3 bg-muted/40 text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    />
                ) : (
                    <input
                        value={setting.value || ""}
                        onChange={(e) => onSettingsChange(settings.map((s) => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                        placeholder={`Valor para ${settingLabels[setting.key] || setting.key}`}
                        className="w-full px-4 py-2.5 bg-muted/40 text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    />
                )}
                <div className="flex justify-end mt-auto pt-2">
                    <Button
                        onClick={() => onSave(setting.key, settings.find((s) => s.key === setting.key)?.value || "")}
                        disabled={isLoading}
                        size="sm"
                        className="transition-all active:scale-95 shadow-sm"
                    >
                        <Save size={16} className="mr-2" /> Guardar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-10 text-foreground pb-12">
            {rewardSettings.length > 0 && (
                <section className="space-y-4">
                    <div className="space-y-1 border-b pb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><Gift size={20} className="text-primary" /> Recompensas y Regalos</h3>
                        <p className="text-sm text-muted-foreground">Incentivos y puntos que el sistema otorga automáticamente.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {rewardSettings.map(renderSetting)}
                    </div>
                </section>
            )}

            {messageSettings.length > 0 && (
                <section className="space-y-4">
                    <div className="space-y-1 border-b pb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare size={20} className="text-primary" /> Avisos al Cliente</h3>
                        <p className="text-sm text-muted-foreground">Textos descriptivos y banners mostrados en la App al usuario.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {messageSettings.map(renderSetting)}
                    </div>
                </section>
            )}

            {otherSettings.length > 0 && (
                <section className="space-y-4">
                    <div className="space-y-1 border-b pb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><SettingsIcon size={20} className="text-primary" /> Otros Ajustes</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {otherSettings.map(renderSetting)}
                    </div>
                </section>
            )}

            {/* Danger Zone */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={20} className="text-destructive" />
                    <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    Esta acción eliminará TODOS los datos de la plataforma (clientes,
                    premios, código, canjes, notificaciones) excepto las cuentas de
                    administrador, los eventos webhook y la configuración. Esta acción es IRREVERSIBLE.
                </p>
                {!showDangerConfirm ? (
                    <Button
                        variant="destructive"
                        onClick={() => setShowDangerConfirm(true)}
                    >
                        Limpiar Base de Datos
                    </Button>
                ) : (
                    <div className="space-y-3 bg-card border border-destructive/30 p-4 rounded-lg">
                        <p className="text-destructive font-medium text-sm">
                            Escribe &quot;ELIMINAR TODO&quot; para confirmar:
                        </p>
                        <input
                            value={dangerText}
                            onChange={(e) => setDangerText(e.target.value)}
                            placeholder="ELIMINAR TODO"
                            className="w-full px-4 py-2.5 bg-accent text-accent-foreground border border-destructive/30 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDangerConfirm(false);
                                    setDangerText("");
                                }}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDangerConfirm}
                                disabled={dangerText !== "ELIMINAR TODO" || isLoading}
                                className="flex-1"
                            >
                                {isLoading ? "Eliminando..." : "Confirmar Eliminacion"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
