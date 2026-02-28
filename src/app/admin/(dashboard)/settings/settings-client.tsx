/**
 * admin/settings/settings-client.tsx
 * Descripcion: Orquestador del módulo de Ajustes con Tabs
 * Refactorizado: 2026-02-28 — Fragmentado en subcomponentes
 */

"use client";

import { useState } from "react";
import { updateSetting, dangerZoneReset } from "@/features/admin/settings/actions/admin-settings";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SettingsGeneralTab } from "@/features/admin/settings/components/settings-general-tab";
import { SettingsAlertsTab } from "@/features/admin/settings/components/settings-alerts-tab";

const defaultAlertPrefs: Record<string, { toast: boolean; sound: boolean }> = {
    new_client: { toast: true, sound: true },
    new_redemption: { toast: true, sound: true },
    points_added: { toast: true, sound: false }
};

interface SettingsClientProps {
    initialSettings: Setting[];
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);

    // Alert Preferences
    const [alertPrefs, setAlertPrefs] = useState<Record<string, { toast: boolean; sound: boolean }>>(() => {
        const prefStr = initialSettings.find(s => s.key === "admin_alert_preferences")?.value;
        if (prefStr && prefStr.trim() !== "") {
            try { return { ...defaultAlertPrefs, ...JSON.parse(prefStr) }; } catch { return defaultAlertPrefs; }
        }
        return defaultAlertPrefs;
    });

    const handleSave = async (key: string, value: string) => {
        setIsLoading(true);
        try {
            await updateSetting(key, value);
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDangerZone = async () => {
        setIsLoading(true);
        try {
            await dangerZoneReset();
            router.refresh();
            toast.success("Base de datos limpiada exitosamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePref = async (eventKey: string, field: 'toast' | 'sound') => {
        const newState = {
            ...alertPrefs,
            [eventKey]: {
                ...alertPrefs[eventKey],
                [field]: !alertPrefs[eventKey]?.[field]
            }
        };
        setIsLoading(true);
        try {
            await updateSetting("admin_alert_preferences", JSON.stringify(newState));
            setAlertPrefs(newState);
            toast.success("Preferencias guardadas exitosamente", { icon: "⚙️" });
            router.refresh();
        } catch {
            toast.error("Error al guardar preferencias");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted p-1">
                <TabsTrigger value="general" className="font-medium">Conf. General</TabsTrigger>
                <TabsTrigger value="alerts" className="font-medium">Preferencias Sensoriales</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
                <SettingsGeneralTab
                    settings={settings}
                    onSettingsChange={setSettings}
                    onSave={handleSave}
                    onDangerZone={handleDangerZone}
                    isLoading={isLoading}
                />
            </TabsContent>

            <TabsContent value="alerts" className="mt-4 text-foreground">
                <SettingsAlertsTab
                    alertPrefs={alertPrefs}
                    onTogglePref={togglePref}
                    isLoading={isLoading}
                />
            </TabsContent>
        </Tabs>
    );
}
