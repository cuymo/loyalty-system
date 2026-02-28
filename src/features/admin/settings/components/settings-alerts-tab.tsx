/**
 * components/settings-alerts-tab.tsx
 * Descripcion: Tab de Preferencias Sensoriales (toast/sound toggles)
 */
"use client";

import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const adminEventsTypes = [
    { key: "new_client", label: "Nuevo Cliente Registrado", desc: "Cuando un usuario se une al sistema por primera vez." },
    { key: "new_redemption", label: "Nueva Solicitud de Canje", desc: "Cuando un cliente escanea o solicita canjear un premio." },
    { key: "points_added", label: "Aumento de Puntos", desc: "Cuando un cliente usa un código QR." },
];

interface SettingsAlertsTabProps {
    alertPrefs: Record<string, { toast: boolean; sound: boolean }>;
    onTogglePref: (eventKey: string, field: 'toast' | 'sound') => void;
    isLoading: boolean;
}

export function SettingsAlertsTab({ alertPrefs, onTogglePref, isLoading }: SettingsAlertsTabProps) {
    return (
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
                                    {pref.toast ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
                                    <span className="text-xs font-semibold w-12 hidden sm:block text-muted-foreground">Aviso</span>
                                    <Switch
                                        checked={pref.toast}
                                        onCheckedChange={() => onTogglePref(evt.key, 'toast')}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="w-[1px] h-6 bg-border/80"></div>
                                <div className="flex items-center gap-2">
                                    {pref.sound ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} className="text-muted-foreground" />}
                                    <span className="text-xs font-semibold w-12 hidden sm:block text-muted-foreground">Sonido</span>
                                    <Switch
                                        checked={pref.sound}
                                        onCheckedChange={() => onTogglePref(evt.key, 'sound')}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
