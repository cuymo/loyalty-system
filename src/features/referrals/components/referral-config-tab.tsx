/**
 * components/referral-config-tab.tsx
 * Descripcion: Tab de configuración del sistema de referidos (activación, metas, bono)
 */
"use client";

import { ShieldCheck, Gem, Plus, Trash, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

interface Milestone {
    id: number;
    amount: number;
    reward: number;
}

interface ReferralConfigTabProps {
    settings: Record<string, string>;
    onSettingsChange: (settings: Record<string, string>) => void;
    milestones: Milestone[];
    onMilestonesChange: (milestones: Milestone[]) => void;
    onSave: () => void;
    isLoading: boolean;
}

export function ReferralConfigTab({
    settings,
    onSettingsChange,
    milestones,
    onMilestonesChange,
    onSave,
    isLoading,
}: ReferralConfigTabProps) {

    const addMilestone = () => {
        const lastAmount = milestones.length > 0 ? milestones[milestones.length - 1].amount : 0;
        onMilestonesChange([...milestones, { id: Date.now(), amount: lastAmount + 2, reward: 50 }]);
    };

    const updateMilestone = (id: number, field: 'amount' | 'reward', value: string) => {
        const num = parseInt(value) || 0;
        onMilestonesChange(milestones.map(m => m.id === id ? { ...m, [field]: num } : m));
    };

    const removeMilestone = (id: number) => {
        if (milestones.length <= 1) {
            toast.error("Debe existir al menos una meta. Si deseas desactivar, usa Activación General.");
            return;
        }
        const index = milestones.findIndex(m => m.id === id);
        if (index === 0) {
            toast.error("La Meta 1 es obligatoria y no se puede eliminar.");
            return;
        }
        onMilestonesChange(milestones.filter(m => m.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Activación General */}
            <div className="flex items-center justify-between p-4 md:p-6 bg-card border rounded-xl">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> Activación General</h3>
                    <p className="text-sm text-muted-foreground mt-1">Si lo apagas, los enlaces dejarán de funcionar y nadie ganará puntos.</p>
                </div>
                <Switch
                    checked={settings.ref_enabled === "true"}
                    onCheckedChange={c => onSettingsChange({ ...settings, ref_enabled: c ? "true" : "false" })}
                />
            </div>

            {/* Metas Secuenciales */}
            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="p-4 md:p-6 border-b bg-muted/20">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Gem size={20} className="text-primary" /> Metas y Lotes Secuenciales</h3>
                    <p className="text-sm text-muted-foreground mt-1">Crea bloques de objetivos. Cuando un cliente invita "N" amigos en total, gana el premio definido.</p>
                </div>
                <div className="p-4 md:p-6 space-y-4">
                    <div className="space-y-3">
                        {milestones.map((m, index) => (
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
                                {index === 0 ? (
                                    <div className="sm:mt-5 shrink-0 w-9" />
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => removeMilestone(m.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 sm:mt-5 shrink-0">
                                        <Trash size={18} />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" onClick={addMilestone} className="w-full border-dashed"><Plus size={16} className="mr-2" /> Añadir Meta Secuencial</Button>
                    </div>

                    {/* Bono Fijo */}
                    <div className="pt-4 mt-6 border-t border-border/50">
                        <div className="space-y-2 max-w-sm">
                            <label className="text-sm font-bold text-foreground">Bono Fijo de Ingreso (Para el Invitado)</label>
                            <Input
                                type="number"
                                value={settings.ref_points_referred || ''}
                                onChange={e => onSettingsChange({ ...settings, ref_points_referred: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Cuántos puntos gana el nuevo cliente instantáneamente al registrarse.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Button onClick={onSave} disabled={isLoading} className="w-full sm:w-auto">
                <Save size={16} className="mr-2" />
                {isLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
        </div>
    );
}
