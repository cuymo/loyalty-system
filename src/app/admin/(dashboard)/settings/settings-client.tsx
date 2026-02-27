/**
 * admin/settings/settings-client.tsx
 * Descripcion: Componente cliente para editar ajustes y la Danger Zone
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { updateSetting, dangerZoneReset } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Save, AlertTriangle, Bell, BellOff, Volume2, VolumeX, Gift, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsClientProps {
    initialSettings: Setting[];
}

const settingLabels: Record<string, string> = {
    client_notice: "Aviso para Clientes (Obsoleto, usar los de abajo)",
    notice_auth: "Aviso a clientes (iniciados sesión)",
    notice_guest: "Aviso a clientes (invitados)",
    birthday_bonus_points: "Puntos de Regalo por Cumpleaños",
};

const adminEventsTypes = [
    { key: "new_client", label: "Nuevo Cliente Registrado", desc: "Cuando un usuario se une al sistema por primera vez." },
    { key: "new_redemption", label: "Nueva Solicitud de Canje", desc: "Cuando un cliente escanea o solicita canjear un premio." },
    { key: "points_added", label: "Aumento de Puntos", desc: "Cuando un cliente usa un código QR." },
];

const defaultAlertPrefs: Record<string, { toast: boolean; sound: boolean }> = {
    new_client: { toast: true, sound: true },
    new_redemption: { toast: true, sound: true },
    points_added: { toast: true, sound: false }
};

export function SettingsClient({ initialSettings }: SettingsClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [showDangerConfirm, setShowDangerConfirm] = useState(false);
    const [dangerText, setDangerText] = useState("");

    // JSON Parser for Alert Prefs
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

    const handleSaveAlertPref = async (newState: typeof alertPrefs) => {
        setIsLoading(true);
        try {
            await updateSetting("admin_alert_preferences", JSON.stringify(newState));
            setAlertPrefs(newState);
            toast.success("Preferencias guardadas exitosamente", { icon: "⚙️" });
            router.refresh();
        } catch (error) {
            toast.error("Error al guardar preferencias");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePref = (eventKey: string, field: 'toast' | 'sound') => {
        const newState = {
            ...alertPrefs,
            [eventKey]: {
                ...alertPrefs[eventKey],
                [field]: !alertPrefs[eventKey]?.[field]
            }
        };
        handleSaveAlertPref(newState);
    };

    const handleDangerZone = async () => {
        if (dangerText !== "ELIMINAR TODO") return;
        setIsLoading(true);
        try {
            await dangerZoneReset();
            setShowDangerConfirm(false);
            setDangerText("");
            router.refresh();
            toast.success("Base de datos limpiada exitosamente.");
        } finally {
            setIsLoading(false);
        }
    };

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

    const renderSetting = (setting: Setting) => (
        <Card key={setting.id} className="border-border shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold text-foreground">
                    {settingLabels[setting.key] || setting.key}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col gap-4">
                {(setting.key === "notice_auth" || setting.key === "notice_guest") ? (
                    <textarea
                        value={setting.value || ""}
                        onChange={(e) => setSettings(settings.map((s) => s.id === setting.id ? { ...s, value: e.target.value } : s))}
                        rows={3}
                        placeholder={`Escribe aquí el ${settingLabels[setting.key]?.toLowerCase() || 'aviso'}`}
                        className="w-full h-full min-h-[100px] px-4 py-3 bg-muted/40 text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    />
                ) : (
                    <input
                        value={setting.value || ""}
                        onChange={(e) => setSettings(settings.map((s) => s.id === setting.id ? { ...s, value: e.target.value } : s))}
                        placeholder={`Valor para ${settingLabels[setting.key] || setting.key}`}
                        className="w-full px-4 py-2.5 bg-muted/40 text-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    />
                )}
                <div className="flex justify-end mt-auto pt-2">
                    <Button
                        onClick={() => handleSave(setting.key, settings.find((s) => s.id === setting.id)?.value || "")}
                        disabled={isLoading}
                        size="sm"
                        className="transition-all active:scale-95 shadow-sm"
                    >
                        <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted p-1">
                <TabsTrigger value="general" className="font-medium">Conf. General</TabsTrigger>
                <TabsTrigger value="alerts" className="font-medium">Preferencias Sensoriales</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-10 text-foreground pb-12">

                {rewardSettings.length > 0 && (
                    <section className="space-y-4">
                        <div className="space-y-1 border-b pb-2">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Recompensas y Regalos</h3>
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
                            <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Avisos al Cliente</h3>
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
                            <h3 className="text-lg font-semibold flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-primary" /> Otros Ajustes</h3>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {otherSettings.map(renderSetting)}
                        </div>
                    </section>
                )}

                {/* Danger Zone */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
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
                                    onClick={handleDangerZone}
                                    disabled={dangerText !== "ELIMINAR TODO" || isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? "Eliminando..." : "Confirmar Eliminacion"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4 text-foreground">
                <Card className="border-border bg-card shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-foreground">Panel de Control de Alertas (En Vivo)</CardTitle>
                        <CardDescription>
                            Configura qué eventos disparan avisos emergentes o sonidos mientras el panel de administración está abierto. Para revisar el historial completo, consulta el <a href="/admin/audit" className="underline text-primary hover:text-primary/80">Registro de Auditoría</a>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0 divide-y divide-border">
                        {adminEventsTypes.map((evt) => {
                            const pref = alertPrefs[evt.key] || { toast: false, sound: false };
                            return (
                                <div key={evt.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-sm text-foreground">{evt.label}</h4>
                                        <p className="text-[13px] text-muted-foreground">{evt.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0 bg-muted/40 p-2 rounded-lg border border-border/50">
                                        <div className="flex items-center gap-2">
                                            {pref.toast ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                                            <span className="text-xs font-semibold w-12 hidden sm:block text-muted-foreground">Aviso</span>
                                            <Switch
                                                checked={pref.toast}
                                                onCheckedChange={() => togglePref(evt.key, 'toast')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="w-[1px] h-6 bg-border/80"></div>
                                        <div className="flex items-center gap-2">
                                            {pref.sound ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                                            <span className="text-xs font-semibold w-12 hidden sm:block text-muted-foreground">Sonido</span>
                                            <Switch
                                                checked={pref.sound}
                                                onCheckedChange={() => togglePref(evt.key, 'sound')}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
