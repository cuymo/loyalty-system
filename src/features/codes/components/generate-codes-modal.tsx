"use client";

import { useState } from "react";
import { generateCodes } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useModalStore } from "@/lib/modal-store";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function GenerateCodesModal() {
    const router = useRouter();
    const { activeModal, closeModal } = useModalStore();
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        prefix: "",
        quantity: 10,
        expirationDate: "",
        codeLength: 4,
        batchName: "",
        pointsValue: 1,
    });

    const isModalOpen = activeModal === "generateCodesModal";

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.expirationDate) return toast.warning("Selecciona una fecha de caducidad");
        setIsLoading(true);
        try {
            const count = await generateCodes(form);
            toast.success(`${count} códigos generados exitosamente`);
            closeModal();
            router.refresh();
        } catch {
            toast.error("Error al generar códigos");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
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
                            onClick={() => closeModal()}
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
    );
}
