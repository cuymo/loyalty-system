/**
 * components/referral-history-tab.tsx
 * Descripcion: Tab del historial/auditoría de invitaciones con tabla
 */
"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const formatEcuadorDate = (date: Date) => {
    return date.toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace('.', '').replace('.', '');
};

interface ReferralHistoryTabProps {
    history: any[];
}

export function ReferralHistoryTab({ history }: ReferralHistoryTabProps) {
    return (
        <div className="bg-card border rounded-xl overflow-hidden">
            <div className="p-4 md:p-6 border-b bg-muted/20">
                <h3 className="text-lg font-bold flex items-center gap-2"><AlertTriangle size={20} className="text-primary" /> Historial de Invitaciones</h3>
                <p className="text-sm text-muted-foreground mt-1">Auditoría en tiempo real de invitaciones completadas.</p>
            </div>
            {history.length > 0 ? (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/10">
                                <TableHead>Fecha</TableHead>
                                <TableHead>Invitador</TableHead>
                                <TableHead>Nuevo Cliente</TableHead>
                                <TableHead className="text-right">Bono Otorgado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatEcuadorDate(new Date(h.createdAt))}
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">{h.referrerName}</TableCell>
                                    <TableCell className="font-medium text-primary">{h.referredName}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex flex-col text-[11px] items-end">
                                            <span className="text-muted-foreground font-bold">+{h.pointsReferrer} Referente</span>
                                            <span className="text-success font-bold">+{h.pointsReferred} Nuevo</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="p-12 text-center text-muted-foreground text-sm">
                    <ShieldCheck size={48} className="mx-auto mb-3 opacity-20" />
                    Aún no hay invitaciones registradas en el sistema.
                </div>
            )}
        </div>
    );
}
