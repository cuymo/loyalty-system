"use client";

import { useState, useEffect } from "react";
import { useModalStore } from "@/lib/modal-store";
import { createReward, updateReward } from "@/features/admin/rewards/actions/admin-rewards";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import type { Reward } from "@/types";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";

export function RewardModal() {
    const router = useRouter();
    const { isOpen, closeModal, data } = useModalStore();
    const isShowing = isOpen("reward_modal");
    const editingReward = data?.reward as Reward | undefined;

    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        imageUrl: [] as string[],
        pointsRequired: 0,
        requiredTier: "none" as "none" | "bronze" | "silver" | "gold" | "vip",
        type: "product" as "discount" | "product" | "credit",
        status: "active" as "active" | "inactive" | "out_of_stock",
        stock: null as number | null,
    });

    const [newImageUrl, setNewImageUrl] = useState("");

    // Sincronizar estado cuando se abre para editar o se limpia para crear
    useEffect(() => {
        if (isShowing) {
            if (editingReward) {
                setForm({
                    name: editingReward.name,
                    description: editingReward.description || "",
                    imageUrl: editingReward.imageUrl || [],
                    pointsRequired: editingReward.pointsRequired,
                    requiredTier: editingReward.requiredTier as "none" | "bronze" | "silver" | "gold" | "vip",
                    type: editingReward.type as "discount" | "product" | "credit",
                    status: editingReward.status as "active" | "inactive" | "out_of_stock",
                    stock: editingReward.stock === undefined ? null : editingReward.stock,
                });
            } else {
                setForm({
                    name: "",
                    description: "",
                    imageUrl: [],
                    pointsRequired: 0,
                    requiredTier: "none",
                    type: "product",
                    status: "active",
                    stock: null, // Inventario infinito
                });
            }
            setNewImageUrl("");
        }
    }, [isShowing, editingReward]);

    const handleAddImage = () => {
        if (newImageUrl && !form.imageUrl.includes(newImageUrl)) {
            setForm({ ...form, imageUrl: [...form.imageUrl, newImageUrl] });
            setNewImageUrl("");
        }
    };

    const handleRemoveImage = (urlToRemove: string) => {
        setForm({ ...form, imageUrl: form.imageUrl.filter(url => url !== urlToRemove) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingReward) {
                await updateReward(editingReward.id, form);
                toast.success("Premio actualizado exitosamente");
            } else {
                await createReward(form);
                toast.success("Premio creado exitosamente");
            }
            closeModal();
            router.refresh();
        } catch (error) {
            console.error("Error:", error);
            toast.error("Ocurrió un error al guardar el premio");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isShowing} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingReward ? "Editar Premio" : "Crear Premio"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Descripcion</Label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm({ ...form, description: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Imágenes (URLs)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            <Button type="button" onClick={handleAddImage} variant="secondary" size="icon" className="shrink-0">
                                <Plus size={18} />
                            </Button>
                        </div>
                        {form.imageUrl.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {form.imageUrl.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img src={url} alt={`Preview ${index}`} className="w-16 h-16 object-cover rounded-md border border-border" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveImage(url)}
                                        >
                                            <X size={12} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-2">
                            <Label>Puntos Requeridos</Label>
                            <Input
                                type="number"
                                value={form.pointsRequired}
                                onChange={(e) =>
                                    setForm({ ...form, pointsRequired: parseInt(e.target.value) || 0 })
                                }
                                min={1}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Inventario (Stock)</Label>
                            <Input
                                type="number"
                                value={form.stock === null ? "" : form.stock}
                                onChange={(e) =>
                                    setForm({ ...form, stock: e.target.value === "" ? null : parseInt(e.target.value) })
                                }
                                min={0}
                                placeholder="Infinito"
                                title="Vacío = Infinito"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nivel Exclusivo</Label>
                            <Select
                                value={form.requiredTier}
                                onValueChange={(val) =>
                                    setForm({
                                        ...form,
                                        requiredTier: val as "none" | "bronze" | "silver" | "gold" | "vip",
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Ninguno</SelectItem>
                                    <SelectItem value="bronze">Bronce</SelectItem>
                                    <SelectItem value="silver">Plata</SelectItem>
                                    <SelectItem value="gold">Oro</SelectItem>
                                    <SelectItem value="vip">VIP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Premio</Label>
                            <Select
                                value={form.type}
                                onValueChange={(val) =>
                                    setForm({
                                        ...form,
                                        type: val as "discount" | "product" | "credit",
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Producto</SelectItem>
                                    <SelectItem value="discount">Descuento</SelectItem>
                                    <SelectItem value="credit">Crédito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2 lg:col-span-4">
                            <Label>Estado Visible</Label>
                            <Select
                                value={form.status}
                                onValueChange={(val) =>
                                    setForm({
                                        ...form,
                                        status: val as "active" | "inactive" | "out_of_stock",
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo (Visible)</SelectItem>
                                    <SelectItem value="out_of_stock">Agotado (Visible, sin stock)</SelectItem>
                                    <SelectItem value="inactive">Inactivo (Oculto)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeModal}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? "Guardando..."
                                : editingReward
                                    ? "Actualizar"
                                    : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
