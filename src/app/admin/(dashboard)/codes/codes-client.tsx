"use client";

import { useState } from "react";
import { QrCode, Plus, Search } from "lucide-react";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BatchCard, type CodeBatch } from "@/features/codes/components/batch-card";
import { GenerateCodesModal } from "@/features/codes/components/generate-codes-modal";
import { ViewBatchModal } from "@/features/codes/components/view-batch-modal";
import { DeleteBatchAlert } from "@/features/codes/components/delete-batch-alert";

interface CodesClientProps {
    initialBatches: CodeBatch[];
}

export function CodesClient({ initialBatches }: CodesClientProps) {
    const { openModal } = useModalStore();

    // Búsqueda y Filtros de Lotes
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all", "available", "exhausted"

    const usagePercent = (batch: CodeBatch) => {
        if (batch.count === 0) return 0;
        return Math.round(((batch.usedCount || 0) / batch.count) * 100);
    };

    const filteredBatches = initialBatches.filter(b => {
        const matchesSearch = b.batchName.toLowerCase().includes(searchQuery.toLowerCase());

        const usage = usagePercent(b);
        let matchesStatus = true;
        if (statusFilter === "available") {
            matchesStatus = usage < 100;
        } else if (statusFilter === "exhausted") {
            matchesStatus = usage === 100;
        }

        return matchesSearch && matchesStatus;
    });

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-start gap-4 items-start sm:items-center">
                <Button onClick={() => openModal("generateCodesModal")} className="w-full sm:w-auto shrink-0">
                    <Plus size={16} className="mr-2" />
                    Generar Códigos
                </Button>

                {initialBatches.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="hidden sm:block w-px h-8 bg-border mx-1"></div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar lote por nombre..."
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
                                <SelectItem value="available">Con Stock</SelectItem>
                                <SelectItem value="exhausted">Agotados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Batch List as Cards */}
            {filteredBatches.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <QrCode size={48} className="mx-auto mb-4 opacity-50" />
                    <p>{searchQuery ? "No se encontraron lotes con esa búsqueda" : "No hay lotes de códigos generados"}</p>
                    {!searchQuery && <p className="text-sm mt-1">Genera el primer lote para empezar</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredBatches.map((batch) => (
                        <BatchCard key={batch.batchName} batch={batch} />
                    ))}
                </div>
            )}

            {/* Global Modals for Codes Module */}
            <GenerateCodesModal />
            <ViewBatchModal />
            <DeleteBatchAlert />
        </>
    );
}
