/**
 * admin/rewards/rewards-client.tsx
 * Descripcion: Componente cliente interactivo para CRUD de Premios con Shadcn UI v4
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { useModalStore } from "@/lib/modal-store";
import type { Reward } from "@/types";
import { Gift, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { RewardCard } from "@/features/admin/rewards/components/reward-card";
import { RewardModal } from "@/features/admin/rewards/components/reward-modal";
import { RewardDeleteAlert } from "@/features/admin/rewards/components/reward-delete-alert";

interface RewardsClientProps {
    initialRewards: Reward[];
}

export function RewardsClient({ initialRewards }: RewardsClientProps) {
    const { openModal } = useModalStore();

    // Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

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
                <Button onClick={() => openModal("reward_modal")} className="w-full sm:w-auto shrink-0">
                    <Plus size={18} className="mr-2" />
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
                                <SelectItem value="active">Activos</SelectItem>
                                <SelectItem value="inactive">Inactivos</SelectItem>
                                <SelectItem value="out_of_stock">Agotados</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="product">Producto</SelectItem>
                                <SelectItem value="discount">Descuento</SelectItem>
                                <SelectItem value="credit">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Grid */}
            {filteredRewards.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Gift size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? "No se encontraron premios con esa búsqueda" : "No hay premios registrados"}</p>
                    {!searchQuery && <p className="text-sm mt-1">Crea el primer premio para empezar</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredRewards.map((reward) => (
                        <RewardCard key={reward.id} reward={reward} />
                    ))}
                </div>
            )}

            {/* Modals Inyectados */}
            <RewardModal />
            <RewardDeleteAlert />
        </>
    );
}
