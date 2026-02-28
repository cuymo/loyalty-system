/**
 * admin/referrals/referrals-client.tsx
 * Descripcion: Orquestador del Módulo de Referidos con Tabs
 * Refactorizado: 2026-02-28 — Fragmentado en subcomponentes
 */

"use client";

import { useState, useMemo } from "react";
import { updateReferralSettings } from "@/features/referrals/actions/admin-referrals";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { ReferralConfigTab } from "@/features/referrals/components/referral-config-tab";
import { ReferralMessageTab } from "@/features/referrals/components/referral-message-tab";
import { ReferralHistoryTab } from "@/features/referrals/components/referral-history-tab";

interface ReferralsClientProps {
    initialSettings: Setting[];
    history: any[];
}

export function ReferralsClient({ initialSettings, history }: ReferralsClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState<Record<string, string>>(
        initialSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value || "" }), {} as Record<string, string>)
    );
    const [isLoading, setIsLoading] = useState(false);

    const initialMilestones = useMemo(() => {
        const val = initialSettings.find(s => s.key === "ref_milestones")?.value;
        if (!val) return [{ id: 1, amount: 3, reward: 50 }];
        try {
            const parsed = JSON.parse(val);
            return parsed.length > 0 ? parsed : [{ id: 1, amount: 3, reward: 50 }];
        } catch {
            return [{ id: 1, amount: 3, reward: 50 }];
        }
    }, [initialSettings]);

    const [milestones, setMilestones] = useState<{ id: number, amount: number, reward: number }[]>(initialMilestones);

    const handleSaveConfig = async () => {
        setIsLoading(true);
        try {
            const finalSettings = { ...settings };
            finalSettings.ref_milestones = JSON.stringify(milestones);
            const updates = Object.keys(finalSettings).map(k => ({ key: k, value: finalSettings[k] }));
            await updateReferralSettings(updates);
            toast.success("Configuración de referidos guardada");
            router.refresh();
        } catch {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMessage = async () => {
        setIsLoading(true);
        try {
            await updateReferralSettings([{ key: "ref_share_message", value: settings.ref_share_message || "" }]);
            toast.success("Mensaje de invitación guardado");
            router.refresh();
        } catch {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tabs defaultValue="config" className="space-y-6">
            <TabsList>
                <TabsTrigger value="config">Configuración</TabsTrigger>
                <TabsTrigger value="message">Mensaje</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6 mt-0">
                <ReferralConfigTab
                    settings={settings}
                    onSettingsChange={setSettings}
                    milestones={milestones}
                    onMilestonesChange={setMilestones}
                    onSave={handleSaveConfig}
                    isLoading={isLoading}
                />
            </TabsContent>

            <TabsContent value="message" className="space-y-6 mt-0">
                <ReferralMessageTab
                    message={settings.ref_share_message || ""}
                    onMessageChange={(msg) => setSettings({ ...settings, ref_share_message: msg })}
                    onSave={handleSaveMessage}
                    isLoading={isLoading}
                />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
                <ReferralHistoryTab history={history} />
            </TabsContent>
        </Tabs>
    );
}
