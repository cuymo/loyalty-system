/**
 * admin/referrals/referrals-client.tsx
 * Descripcion: UI interactiva del Módulo de Referidos con Tabs
 * Fecha de creacion: 2026-02-26
 */

"use client";

import { useState, useMemo } from "react";
import { updateReferralSettings } from "@/actions/admin/referrals";
import { useRouter } from "next/navigation";
import { Save, AlertTriangle, ShieldCheck, Gem, Users, Plus, Trash } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
            return JSON.parse(val);
        } catch {
            return [{ id: 1, amount: 3, reward: 50 }];
        }
    }, [initialSettings]);

    const [milestones, setMilestones] = useState<{ id: number, amount: number, reward: number }[]>(initialMilestones);

    const handleSave = async () => {
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

    const addMilestone = () => {
        const lastAmount = milestones.length > 0 ? milestones[milestones.length - 1].amount : 0;
        setMilestones([...milestones, { id: Date.now(), amount: lastAmount + 2, reward: 50 }]);
    };

    const updateMilestone = (id: number, field: 'amount' | 'reward', value: string) => {
        const num = parseInt(value) || 0;
        setMilestones(prev => prev.map(m => m.id === id ? { ...m, [field]: num } : m));
    };

    const removeMilestone = (id: number) => {
        setMilestones(prev => prev.filter(m => m.id !== id));
    };

    return (
        <Tabs defaultValue="config" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <TabsList>
                    <TabsTrigger value="config">Configuración</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Guardando..." : "Guardar Configuración"}
                </Button>
            </div>

            <TabsContent value="config" className="space-y-6 mt-0">
                <div className="flex items-center justify-between p-4 md:p-6 bg-card border rounded-xl">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> Activación General</h3>
                        <p className="text-sm text-muted-foreground mt-1">Si lo apagas, los enlaces dejarán de funcionar y nadie ganará puntos.</p>
                    </div>
                    <Switch
                        checked={settings.ref_enabled === "true"}
                        onCheckedChange={c => setSettings({ ...settings, ref_enabled: c ? "true" : "false" })}
                    />
                </div>

                <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-muted/20">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Gem size={20} className="text-primary" /> Metas y Lotes Secuenciales</h3>
                        <p className="text-sm text-muted-foreground mt-1">Crea bloques de objetivos. Cuando un cliente invita "N" amigos en total, gana el premio definido.</p>
                    </div>
                    <div className="p-4 md:p-6 space-y-4">
                        <div className="space-y-3">
                            {milestones.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No hay metas configuradas. Crea una.</p>
                            ) : (
                                milestones.map((m, index) => (
                                    <div key={m.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-muted/10 border rounded-lg">
                                        <Badge variant="outline" className="shrink-0 bg-background">Meta {index + 1}</Badge>
                                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Referidos Totales Requeridos</label>
                                                <Input type="number" min={1} value={m.amount || ''} onChange={e => updateMilestone(m.id, 'amount', e.target.value)} className="bg-background" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Puntos de Premio</label>
                                                <Input type="number" min={0} value={m.reward || ''} onChange={e => updateMilestone(m.id, 'reward', e.target.value)} className="bg-background" />
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeMilestone(m.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mt-5 shrink-0">
                                            <Trash size={18} />
                                        </Button>
                                    </div>
                                ))
                            )}
                            <Button variant="outline" onClick={addMilestone} className="w-full border-dashed"><Plus size={16} className="mr-2" /> Añadir Meta Secuencial</Button>
                        </div>

                        <div className="pt-4 mt-6 border-t border-border/50">
                            <div className="space-y-2 max-w-sm">
                                <label className="text-sm font-bold text-foreground">Bono Fijo de Ingreso (Para el Invitado)</label>
                                <Input
                                    type="number"
                                    value={settings.ref_points_referred || ''}
                                    onChange={e => setSettings({ ...settings, ref_points_referred: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Cuántos puntos gana el nuevo cliente instantáneamente al registrarse.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-muted/20">
                        <h3 className="text-lg font-bold flex items-center gap-2"><Users size={20} className="text-primary" /> Mensaje de Invitación</h3>
                        <p className="text-sm text-muted-foreground mt-1">Plantilla que se precargará en WhatsApp cuando tu cliente pulse "Compartir".</p>
                    </div>
                    <div className="p-4 md:p-6">
                        <textarea
                            rows={3}
                            value={settings.ref_share_message || ""}
                            onChange={e => setSettings({ ...settings, ref_share_message: e.target.value })}
                            placeholder="Ej. Únete a mi tienda y gana puntos: {{link}}"
                            className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                        <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">La palabra <b className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{`{{link}}`}</b> será reemplazada automáticamente por el enlace único del cliente.</p>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
                <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="p-4 md:p-6 border-b bg-muted/20">
                        <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle size={20} className="text-primary" /> Historial de Invitaciones</h3>
                        <p className="text-sm text-muted-foreground mt-1">Auditoría en tiempo real de invitaciones completadas.</p>
                    </div>
                    {history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/10">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Invitador</TableHead>
                                        <TableHead>Nuevo Cliente</TableHead>
                                        <TableHead className="text-right">Bono Otorgado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(h.createdAt).toLocaleString('es-EC', {
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
