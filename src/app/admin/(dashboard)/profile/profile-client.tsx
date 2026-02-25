"use client";

import { useState } from "react";
import { updateAdminProfile } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Save, UserCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileClientProps {
    initialName: string;
    initialEmail: string;
    adminId: number;
}

export function ProfileClient({ initialName, initialEmail, adminId }: ProfileClientProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: initialName,
        email: initialEmail,
        password: "",
        confirmPassword: "",
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password && form.password !== form.confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);
        try {
            await updateAdminProfile(adminId, {
                name: form.name,
                email: form.email,
                ...(form.password ? { password: form.password } : {}),
            });

            toast.success("Perfil actualizado correctamente. Los cambios se reflejarán en tu próxima sesión o recarga.");
            setForm(prev => ({ ...prev, password: "", confirmPassword: "" })); // Clear passwords
            router.refresh();
        } catch (error) {
            toast.error("Ocurrió un error al actualizar el perfil.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                        <UserCircle className="w-16 h-16 text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-medium text-foreground">Información Pública</h3>
                            <p className="text-sm text-muted-foreground">Tus datos básicos de acceso.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Ej: Admin Zingy"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="admin@ejemplo.com"
                                required
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div>
                                <h4 className="text-sm font-medium text-foreground mb-1">Cambiar Contraseña</h4>
                                <p className="text-xs text-muted-foreground">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nueva Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-border">
                        <Button type="submit" disabled={isLoading} className="gap-2">
                            <Save className="w-4 h-4" />
                            {isLoading ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
