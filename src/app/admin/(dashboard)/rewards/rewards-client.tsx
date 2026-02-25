/**
 * admin/rewards/rewards-client.tsx
 * Descripcion: Componente cliente interactivo para CRUD de Premios con Shadcn UI v4
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { createReward, updateReward, deleteReward } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Gift, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "@/lib/toast";
import type { Reward } from "@/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RewardsClientProps {
    initialRewards: Reward[];
}

export function RewardsClient({ initialRewards }: RewardsClientProps) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [form, setForm] = useState({
        name: "",
        description: "",
        imageUrl: "",
        pointsRequired: 0,
        requiredTier: "none" as "none" | "bronze" | "silver" | "gold" | "vip",
        type: "product" as "discount" | "product",
        status: "active" as "active" | "inactive",
    });

    const openCreate = () => {
        setEditingReward(null);
        setForm({
            name: "",
            description: "",
            imageUrl: "",
            pointsRequired: 0,
            requiredTier: "none",
            type: "product",
            status: "active",
        });
        setShowModal(true);
    };

    const openEdit = (reward: Reward) => {
        setEditingReward(reward);
        setForm({
            name: reward.name,
            description: reward.description || "",
            imageUrl: reward.imageUrl || "",
            pointsRequired: reward.pointsRequired,
            requiredTier: reward.requiredTier as "none" | "bronze" | "silver" | "gold" | "vip",
            type: reward.type as "discount" | "product",
            status: reward.status as "active" | "inactive",
        });
        setShowModal(true);
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
            setShowModal(false);
            router.refresh();
        } catch (error) {
            console.error("Error:", error);
            toast.error("Ocurrió un error al guardar el premio");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        try {
            const result = await deleteReward(deleteId);
            if (result && !result.success) {
                toast.error(result.error || "No se pudo eliminar el premio.");
            } else {
                setDeleteId(null);
                toast.success("Premio eliminado");
                router.refresh();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const filteredRewards = initialRewards.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesType = typeFilter === "all" || r.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-start gap-4 items-start sm:items-center">
                <Button onClick={openCreate} className="w-full sm:w-auto shrink-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Premio
                </Button>

                {initialRewards.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="hidden sm:block w-px h-8 bg-border mx-1"></div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar premios..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Activo</SelectItem>
                                <SelectItem value="inactive">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="discount">Descuento</SelectItem>
                                <SelectItem value="product">Producto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Table */}
            {filteredRewards.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? "No se encontraron premios con esa búsqueda" : "No hay premios registrados"}</p>
                    {!searchQuery && <p className="text-sm mt-1">Crea el primer premio para empezar</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredRewards.map((reward) => (
                        <Card key={reward.id} className="overflow-hidden flex flex-col group relative">
                            {/* Actions Overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="secondary"
                                    size="icon-sm"
                                    className="h-8 w-8 shadow-sm"
                                    onClick={() => openEdit(reward)}
                                    title="Editar"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon-sm"
                                    className="h-8 w-8 shadow-sm"
                                    onClick={() => setDeleteId(reward.id)}
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>

                            {/* Image Container - same as campaigns */}
                            <div className="relative w-full pb-[56%] md:pb-[75%] bg-card border-b border-border">
                                {reward.imageUrl ? (
                                    <img
                                        src={reward.imageUrl}
                                        alt={reward.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                                        <Gift className="w-12 h-12 mb-2" />
                                        <span className="text-sm font-medium">Sin Imagen</span>
                                    </div>
                                )}

                                <Badge
                                    className="absolute bottom-3 right-3 shadow-md border-border bg-card/10 backdrop-blur-md text-foreground hover:bg-card/20"
                                >
                                    {reward.pointsRequired} pts
                                </Badge>
                                <Badge
                                    className="absolute bottom-3 left-3 shadow-md text-xs font-semibold"
                                    variant={reward.type === "discount" ? "secondary" : "default"}
                                >
                                    {reward.type === "discount" ? "Descuento" : "Producto"}
                                </Badge>
                                {reward.status === "inactive" && (
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <Badge variant="destructive" className="font-bold text-sm tracking-wider">
                                            INACTIVO
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4 flex-1">
                                <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                                    {reward.name}
                                </h3>
                                <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">
                                    {reward.description || "Sin descripción"}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
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
                                className="w-full px-3 py-2 bg-accent text-accent-foreground border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL de Imagen</Label>
                            <Input
                                type="url"
                                value={form.imageUrl}
                                onChange={(e) =>
                                    setForm({ ...form, imageUrl: e.target.value })
                                }
                                placeholder="https://ejemplo.com/imagen.jpg"
                            />
                            {form.imageUrl && (
                                <p className="text-xs text-muted-foreground">Se mostrará en la tarjeta si la URL es válida.</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-2">
                                <Label>Puntos</Label>
                                <Input
                                    type="number"
                                    value={form.pointsRequired}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            pointsRequired:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    min={1}
                                    required
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nivel Requerido</Label>
                                <Select
                                    value={form.requiredTier}
                                    onValueChange={(val) =>
                                        setForm({
                                            ...form,
                                            requiredTier: val as "none" | "bronze" | "silver" | "gold" | "vip",
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
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
                                <Label>Tipo</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(val) =>
                                        setForm({
                                            ...form,
                                            type: val as "discount" | "product",
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">Producto</SelectItem>
                                        <SelectItem value="discount">Descuento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(val) =>
                                        setForm({
                                            ...form,
                                            status: val as "active" | "inactive",
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Activo</SelectItem>
                                        <SelectItem value="inactive">Inactivo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowModal(false)}
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

            {/* Delete Confirmation */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar premio?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer. Se eliminará permanentemente el premio seleccionado.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
