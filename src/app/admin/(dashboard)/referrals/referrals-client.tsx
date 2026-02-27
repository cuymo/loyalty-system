/**
 * admin/referrals/referrals-client.tsx
 * Descripcion: UI interactiva del Módulo de Referidos
 * Fecha de creacion: 2026-02-26
 */

"use client";

import { useState } from "react";
import { updateReferralSettings } from "@/actions/admin/referrals";
import { useRouter } from "next/navigation";
import { Save, Users, AlertTriangle, ShieldCheck, Gem } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ReferralsClientProps {
    initialSettings: Setting[];
    history: any[]; // Result from getReferralHistory
}

export function ReferralsClient({ initialSettings, history }: ReferralsClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState<Record<string, string>>(
        initialSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value || "" }), {} as Record<string, string>)
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updates = Object.keys(settings).map(k => ({ key: k, value: settings[k] }));
            await updateReferralSettings(updates);
            toast.success("Configuración de referidos guardada");
            router.refresh();
        } catch {
            toast.error("Error al guardar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tabs defaultValue="rules" className="space-y-6">
            <TabsList className="bg-muted p-1">
                <TabsTrigger value="rules" className="font-medium gap-2"><ShieldCheck size={16} /> Reglas y Límites</TabsTrigger>
                <TabsTrigger value="bonuses" className="font-medium gap-2"><Gem size={16} /> Bonos Dinámicos</TabsTrigger>
                <TabsTrigger value="messages" className="font-medium gap-2"><Users size={16} /> Mensajes / Comparte</TabsTrigger>
                <TabsTrigger value="audit" className="font-medium gap-2"><AlertTriangle size={16} /> Auditoría</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-4 space-y-6 text-foreground animate-in fade-in">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Activación del Programa</h3>
                            <p className="text-sm text-muted-foreground">Si lo apagas, nadie podrá ganar puntos usando el código de otro amigo.</p>
                        </div>
                        <Switch
                            checked={settings.ref_enabled === "true"}
                            onCheckedChange={c => setSettings({ ...settings, ref_enabled: c ? "true" : "false" })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Límite Mensual Estricto</label>
                            <input
                                type="number"
                                value={settings.ref_monthly_limit}
                                onChange={e => setSettings({ ...settings, ref_monthly_limit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-accent/30 focus:bg-background border border-border/50 rounded-lg text-foreground transition-all"
                            />
                            <p className="text-xs text-muted-foreground">Máximo de veces que un usuario puede dar/recibir referidos al mes. Evita granjas de cuentas.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Límite Vitalicio</label>
                            <input
                                type="number"
                                value={settings.ref_lifetime_limit}
                                onChange={e => setSettings({ ...settings, ref_lifetime_limit: e.target.value })}
                                className="w-full px-4 py-2.5 bg-accent/30 focus:bg-background border border-border/50 rounded-lg text-foreground transition-all"
                            />
                            <p className="text-xs text-muted-foreground">Tope absoluto de referidos que puede capitalizar en la vida de su cuenta.</p>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto h-11 px-8">
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Guardando..." : "Guardar Reglas"}
                </Button>
            </TabsContent>

            <TabsContent value="bonuses" className="mt-4 space-y-6 text-foreground animate-in fade-in">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Bonos Escalonados por Nivel (Tier)</h3>
                    <p className="text-sm text-muted-foreground mb-6">Incentiva a los clientes VIP premiándolos más cuando invitan a un amigo, en comparación con usuarios Bronce.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 border border-border/40 rounded-lg space-y-1 bg-accent/5">
                            <label className="text-xs font-black uppercase tracking-wider text-[#CD7F32]">Recompensa Bronce</label>
                            <input
                                type="number"
                                value={settings.ref_points_referrer_bronze}
                                onChange={e => setSettings({ ...settings, ref_points_referrer_bronze: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border/50 rounded shadow-inner"
                            />
                        </div>

                        <div className="p-4 border border-border/40 rounded-lg space-y-1 bg-accent/5">
                            <label className="text-xs font-black uppercase tracking-wider text-blue-500">Recompensa Plata</label>
                            <input
                                type="number"
                                value={settings.ref_points_referrer_silver}
                                onChange={e => setSettings({ ...settings, ref_points_referrer_silver: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border/50 rounded shadow-inner"
                            />
                        </div>

                        <div className="p-4 border border-border/40 rounded-lg space-y-1 bg-accent/5">
                            <label className="text-xs font-black uppercase tracking-wider text-amber-500">Recompensa Oro</label>
                            <input
                                type="number"
                                value={settings.ref_points_referrer_gold}
                                onChange={e => setSettings({ ...settings, ref_points_referrer_gold: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border/50 rounded shadow-inner"
                            />
                        </div>

                        <div className="p-4 border border-border/40 rounded-lg space-y-1 bg-accent/5">
                            <label className="text-xs font-black uppercase tracking-wider text-red-500">Recompensa VIP</label>
                            <input
                                type="number"
                                value={settings.ref_points_referrer_vip}
                                onChange={e => setSettings({ ...settings, ref_points_referrer_vip: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border/50 rounded shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/50 mt-6">
                        <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <label className="text-sm font-bold text-primary">Bono Fijo de Ingreso (Para el Invitado)</label>
                            <input
                                type="number"
                                value={settings.ref_points_referred}
                                onChange={e => setSettings({ ...settings, ref_points_referred: e.target.value })}
                                className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-lg"
                            />
                            <p className="text-xs text-muted-foreground/80 font-medium">Cuántos puntos gana el nuevo cliente al registrarse con cualquier código válido.</p>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto h-11 px-8">
                    <Save className="w-4 h-4 mr-2" />
                    Guadar Bonos
                </Button>
            </TabsContent>

            <TabsContent value="messages" className="mt-4 space-y-6 text-foreground animate-in fade-in">
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold">Plantilla de Invitación Nativa</h3>
                    <p className="text-sm text-muted-foreground">Este es el mensaje que se precargará en WhatsApp/Redes cuando tu cliente pulse &quot;Compartir&quot; en su perfil.</p>

                    <div className="space-y-2 pt-2">
                        <textarea
                            rows={4}
                            value={settings.ref_share_message}
                            onChange={e => setSettings({ ...settings, ref_share_message: e.target.value })}
                            placeholder="Escribe el mensaje..."
                            className="w-full px-4 py-3 bg-accent/30 focus:bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                        <div className="flex gap-2">
                            <span className="text-[10px] font-mono tracking-widest bg-muted/50 border border-border/40 px-2 py-1 rounded text-muted-foreground">Variables obligatorias: <b className="text-foreground">{`{{link}}`}</b></span>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isLoading} className="w-full md:w-auto h-11 px-8">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Mensaje
                </Button>
            </TabsContent>

            <TabsContent value="audit" className="mt-4 text-foreground animate-in fade-in">
                <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-border/50 bg-muted/10">
                        <h3 className="text-lg font-bold">Registro del Módulo de Referidos</h3>
                        <p className="text-sm text-muted-foreground">Auditoría en tiempo real de invitaciones completadas. Te permite rastrear actividad inusual.</p>
                    </div>
                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Invitador</TableHead>
                                        <TableHead>Nuevo Cliente</TableHead>
                                        <TableHead className="text-right">Bono Otorgado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((h, i) => (
                                        <TableRow key={h.id} className="hover:bg-accent/5">
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(h.createdAt).toLocaleString('es-ES', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">{h.referrerName}</TableCell>
                                            <TableCell className="font-medium text-primary">{h.referredName}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="inline-flex flex-col text-[11px] items-end">
                                                    <span className="text-muted-foreground font-bold">+{h.pointsReferrer} Referente</span>
                                                    <span className="text-success font-bold">+{h.pointsReferred} Nuevo</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground text-sm">
                            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Aún no hay invitaciones registradas en el sistema.
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}
