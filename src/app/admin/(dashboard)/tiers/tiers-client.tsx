"use client";

import { useState } from "react";
import { updateSetting } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Save, Crown } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TiersClientProps {
    initialSettings: Setting[];
}

const tierConfig = [
    { key: "tier_bronze_points", label: "Nivel Bronce", description: "Puntos históricos para desbloquear premios Bronce", color: "bg-orange-800/20 text-orange-600 border-orange-800/30" },
    { key: "tier_silver_points", label: "Nivel Plata", description: "Puntos históricos para desbloquear premios Plata", color: "bg-slate-400/20 text-slate-500 border-slate-400/30" },
    { key: "tier_gold_points", label: "Nivel Oro", description: "Puntos históricos para desbloquear premios Oro", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
    { key: "tier_vip_points", label: "Nivel Ultimate VIP", description: "Puntos históricos para desbloquear el nivel más alto", color: "bg-primary/20 text-primary border-primary/30" },
];

export function TiersClient({ initialSettings }: TiersClientProps) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (key: string, value: string) => {
        setIsLoading(true);
        try {
            await updateSetting(key, value);
            router.refresh();
            toast.success("Ajuste de nivel actualizado exitosamente");
        } catch (error) {
            toast.error("Error al actualizar el nivel");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tierConfig.map((tier) => {
                const setting = settings.find((s) => s.key === tier.key);
                const value = setting?.value || "0";

                return (
                    <div key={tier.key} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl border ${tier.color}`}>
                                <Crown size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{tier.label}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                            </div>
                        </div>

                        <div className="flex items-end gap-3 pt-2">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor={tier.key} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Meta de Puntos
                                </Label>
                                <Input
                                    id={tier.key}
                                    type="number"
                                    min="0"
                                    value={value}
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setSettings(prev => prev.map(s => s.key === tier.key ? { ...s, value: newVal } : s));
                                    }}
                                    className="font-mono text-lg"
                                />
                            </div>
                            <Button
                                onClick={() => handleSave(tier.key, value)}
                                disabled={isLoading}
                                className="shrink-0 gap-2 mb-0.5"
                            // variant="secondary"
                            >
                                <Save size={16} />
                                Guardar
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
