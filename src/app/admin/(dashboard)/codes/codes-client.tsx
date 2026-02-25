/**
 * admin/codes/codes-client.tsx
 * Descripcion: Componente cliente para generar codigos en lotes y ver lotes existentes
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-22
 * Descripcion: Rediseño a tarjetas, formulario mejorado, longitud por defecto 4
 */

"use client";

import { useState } from "react";
import { generateCodes, getCodes, deleteBatch } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { QrCode, Plus, Download, Eye, Package, Trash2, CalendarIcon, Search } from "lucide-react";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Code } from "@/types";

type EnrichedCode = Code & {
    usedByUsername: string | null;
    usedByPhone: string | null;
};

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CodeBatch {
    batchName: string;
    count: number;
    usedCount: number;
}

interface CodesClientProps {
    initialBatches: CodeBatch[];
}

export function CodesClient({ initialBatches }: CodesClientProps) {
    const router = useRouter();
    const [showGenerator, setShowGenerator] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // For generator form submission

    // Búsqueda y Filtros de Lotes
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all", "available", "exhausted"

    // Estados para el Modal de Visualizacion de Códigos
    const [viewBatchName, setViewBatchName] = useState<string | null>(null);
    const [batchCodes, setBatchCodes] = useState<EnrichedCode[]>([]);
    const [viewCodesLoading, setViewCodesLoading] = useState(false);

    // Estados para el Modal de Eliminación
    const [deleteBatchName, setDeleteBatchName] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const batchToDelete = initialBatches.find(b => b.batchName === deleteBatchName);
    const isDeleteExhausted = batchToDelete ? batchToDelete.count === batchToDelete.usedCount : false;

    const [form, setForm] = useState({
        prefix: "",
        quantity: 10,
        expirationDate: "",
        codeLength: 4,
        batchName: "",
        pointsValue: 1,
    });

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.expirationDate) return toast.warning("Selecciona una fecha de caducidad");
        setIsLoading(true);
        try {
            const count = await generateCodes(form);
            toast.success(`${count} códigos generados exitosamente`);
            setShowGenerator(false);
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    const exportBatch = (batchName: string) => {
        const csv = [
            "Codigo,Estado",
            ...batchCodes.map(
                (c) =>
                    `${c.code},${c.status}`
            ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${batchName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const usagePercent = (batch: CodeBatch) => {
        if (batch.count === 0) return 0;
        return Math.round(((batch.usedCount || 0) / batch.count) * 100);
    };

    const handleViewBatch = async (batchName: string) => {
        setViewBatchName(batchName);
        setViewCodesLoading(true);
        try {
            const result = await getCodes(batchName);
            setBatchCodes(result);
        } catch {
            toast.error("Error al cargar los códigos");
            setViewBatchName(null);
        } finally {
            setViewCodesLoading(false);
        }
    };

    const handleDeleteBatch = async () => {
        if (!deleteBatchName) return;
        setDeleteLoading(true);
        try {
            const count = await deleteBatch(deleteBatchName);
            if (isDeleteExhausted) {
                toast.success(`El lote ${deleteBatchName} ha sido archivado/ocultado exitosamente.`);
            } else {
                toast.success(`${count} códigos no utilizados eliminados permanentemente.`);
            }
            setDeleteBatchName(null);
            router.refresh();
        } catch {
            toast.error("Error al eliminar el lote");
        } finally {
            setDeleteLoading(false);
        }
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
                <Button onClick={() => setShowGenerator(true)} className="w-full sm:w-auto shrink-0">
                    <Plus className="mr-2 h-4 w-4" />
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
                        <Card
                            key={batch.batchName}
                            className="overflow-hidden cursor-pointer hover:border-border/80 transition-colors"
                            onClick={() => handleViewBatch(batch.batchName)}
                        >
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Package size={16} className="text-muted-foreground shrink-0" />
                                        <h3 className="font-semibold text-foreground text-sm truncate">
                                            {batch.batchName}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewBatch(batch.batchName);
                                            }}
                                        >
                                            <Eye size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteBatchName(batch.batchName);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Usados</span>
                                        <span>{batch.usedCount || 0} / {batch.count}</span>
                                    </div>
                                    <div className="w-full h-2 bg-accent text-accent-foreground rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${usagePercent(batch) > 75
                                                ? "bg-destructive"
                                                : usagePercent(batch) > 40
                                                    ? "bg-warning"
                                                    : "bg-success"
                                                }`}
                                            style={{ width: `${usagePercent(batch)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {batch.count} códigos
                                    </Badge>
                                    {usagePercent(batch) === 100 && (
                                        <Badge variant="destructive" className="text-xs">
                                            Agotado
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Generator Modal */}
            <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generar Códigos</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre del Lote</Label>
                            <Input
                                value={form.batchName}
                                onChange={(e) =>
                                    setForm({ ...form, batchName: e.target.value })
                                }
                                required
                                placeholder="ej: Lote Febrero 2026"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha de Caducidad</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${!form.expirationDate ? "text-muted-foreground" : ""
                                            }`}
                                    >
                                        <CalendarIcon size={16} className="mr-2" />
                                        {form.expirationDate
                                            ? format(new Date(form.expirationDate + "T12:00:00"), "PPP", { locale: es })
                                            : "Selecciona una fecha"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            form.expirationDate
                                                ? new Date(form.expirationDate + "T12:00:00")
                                                : undefined
                                        }
                                        onSelect={(date) =>
                                            setForm({
                                                ...form,
                                                expirationDate: date
                                                    ? format(date, "yyyy-MM-dd")
                                                    : "",
                                            })
                                        }
                                        disabled={{ before: new Date() }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Prefijo</Label>
                            <Input
                                value={form.prefix}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                                    })
                                }
                                required
                                maxLength={8}
                                placeholder="ej: CZ"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    value={form.quantity || ""}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setForm({
                                            ...form,
                                            quantity: isNaN(val) ? 0 : val,
                                        });
                                    }}
                                    min={1}
                                    max={10000}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Longitud</Label>
                                <Input
                                    type="number"
                                    value={form.codeLength || ""}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setForm({
                                            ...form,
                                            codeLength: isNaN(val) ? 0 : Math.min(val, 12),
                                        });
                                    }}
                                    min={4}
                                    max={12}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Puntos</Label>
                                <Input
                                    type="number"
                                    value={form.pointsValue || ""}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setForm({
                                            ...form,
                                            pointsValue: isNaN(val) ? 0 : val,
                                        });
                                    }}
                                    min={1}
                                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-card border border-border rounded-lg p-4 text-center space-y-2 overflow-hidden">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Vista Previa</p>
                            <div className="flex items-center justify-center gap-2 min-w-0">
                                <code className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-success font-mono text-sm truncate min-w-0 block">
                                    {form.prefix || "CZ"}{Array(Math.min(form.codeLength || 4, 12)).fill("X").join("")}
                                </code>
                                <Badge variant="secondary" className="shrink-0">
                                    +{form.pointsValue || 0} pts
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {form.quantity || 0} códigos &middot; {(form.prefix || "CZ").length + (form.codeLength || 4)} caracteres c/u
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowGenerator(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Generando..." : "Generar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Batch Detail Modal */}
            <Dialog open={!!viewBatchName} onOpenChange={(open) => !open && setViewBatchName(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2 shrink-0 flex flex-row items-center justify-between border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Eye size={20} className="text-muted-foreground" />
                            Lote: {viewBatchName}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {batchCodes.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => exportBatch(viewBatchName || "export")}
                                >
                                    <Download size={16} />
                                    Exportar a CSV
                                </Button>
                            )}
                            <Button variant="ghost" size="icon-sm" onClick={() => setViewBatchName(null)}>
                                <span className="sr-only">Cerrar</span>
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="overflow-auto flex-1 rounded-md p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead className="hidden sm:table-cell">Pts</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="hidden md:table-cell">Creado</TableHead>
                                    <TableHead>Usado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batchCodes.map((code) => (
                                    <TableRow
                                        key={code.id}
                                        className={code.status === "used" && code.usedByClientId
                                            ? "cursor-pointer hover:bg-primary/5 transition-colors"
                                            : ""}
                                        onClick={() => {
                                            if (code.status === "used" && code.usedByClientId) {
                                                setViewBatchName(null);
                                                router.push(`/admin/clients?highlight=${code.usedByClientId}&code=${code.code}`);
                                            }
                                        }}
                                    >
                                        <TableCell className="font-mono text-xs sm:text-sm">
                                            {code.code}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <span className="text-xs text-muted-foreground">+{code.pointsValue}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={code.status === "used" ? "destructive" : "default"}
                                            >
                                                {code.status === "used" ? "Usado" : "Disponible"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                            {code.createdAt
                                                ? format(new Date(code.createdAt), "dd MMM yyyy", { locale: es })
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {code.status === "used" ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-foreground font-medium">
                                                        {code.usedByUsername || "Desconocido"}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {code.usedAt
                                                            ? format(new Date(code.usedAt), "dd MMM, HH:mm", { locale: es })
                                                            : "—"}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Batch Dialog */}
            <Dialog open={!!deleteBatchName} onOpenChange={(open) => !open && setDeleteBatchName(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Lote</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4 text-sm text-muted-foreground">
                        {isDeleteExhausted ? (
                            <>
                                <p>
                                    El lote <strong className="text-foreground">{deleteBatchName}</strong> está <strong>agotado</strong>.
                                </p>
                                <p>
                                    Al eliminarlo, se ocultará permanentemente de esta lista para mantener el orden. El historial de canjes de los clientes no se verá afectado.
                                </p>
                            </>
                        ) : (
                            <>
                                <p>
                                    ¿Estás seguro que deseas eliminar el lote <strong className="text-foreground">{deleteBatchName}</strong>?
                                </p>
                                <p>
                                    Solo se eliminarán los códigos <strong>no utilizados</strong>. Los códigos que ya han sido canjeados por los clientes se mantendrán para preservar el historial.
                                </p>
                            </>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteBatchName(null)}
                            disabled={deleteLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteBatch}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
