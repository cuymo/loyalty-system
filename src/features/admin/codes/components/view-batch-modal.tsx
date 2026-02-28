"use client";

import { useState, useEffect } from "react";
import { getCodes } from "@/features/admin/codes/actions/admin-codes";
import { Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/lib/modal-store";
import { useRouter } from "next/navigation";
import type { Code } from "@/types";

type EnrichedCode = Code & {
    usedByUsername: string | null;
    usedByPhone: string | null;
};

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";

export function ViewBatchModal() {
    const router = useRouter();
    const { activeModal, data, closeModal } = useModalStore();
    const [batchCodes, setBatchCodes] = useState<EnrichedCode[]>([]);

    const isModalOpen = activeModal === "viewBatchModal";
    const batchName = data?.batchName as string | undefined;

    useEffect(() => {
        if (isModalOpen && batchName) {
            getCodes(batchName)
                .then(setBatchCodes)
                .catch(() => {
                    toast.error("Error al cargar los códigos");
                    closeModal();
                });
        } else {
            setBatchCodes([]);
        }
    }, [isModalOpen, batchName, closeModal]);

    const exportBatch = (exportBatchName: string) => {
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
        a.download = `${exportBatchName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 shrink-0 flex flex-row items-center justify-between border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Eye size={20} className="text-muted-foreground" />
                        Lote: {batchName}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {batchCodes.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => exportBatch(batchName || "export")}
                            >
                                <Download size={16} />
                                Exportar a CSV
                            </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => closeModal()}>
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
                                    className={code.status === "used" && code.usedBy
                                        ? "cursor-pointer hover:bg-primary/5 transition-colors"
                                        : ""}
                                    onClick={() => {
                                        if (code.status === "used" && code.usedBy) {
                                            closeModal();
                                            router.push(`/admin/clients?highlight=${code.usedBy}&code=${code.code}`);
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
    );
}
