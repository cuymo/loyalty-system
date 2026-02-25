"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type AuditLog = {
    id: number;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
};

interface AuditLogClientProps {
    initialLogs: AuditLog[];
}

export function AuditLogClient({ initialLogs }: AuditLogClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredLogs = initialLogs.filter((log) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = log.message.toLowerCase().includes(term) || log.type.toLowerCase().includes(term);

        let matchesType = true;
        if (typeFilter !== "all") {
            if (typeFilter === "system") {
                matchesType = log.type.startsWith("admin_") && !log.type.includes("reward") && !log.type.includes("redemption") && !log.type.includes("client");
            } else if (typeFilter === "clients") {
                matchesType = log.type.startsWith("client_") || log.type === "new_client" || log.type === "admin_deleted_client";
            } else if (typeFilter === "rewards") {
                matchesType = log.type.includes("reward") || log.type.includes("redemption") || log.type === "points_added";
            } else if (typeFilter === "codes") {
                matchesType = log.type.includes("code") || log.type.includes("batch");
            }
        }

        return matchesSearch && matchesType;
    });

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "new_client":
            case "client_reactivated":
                return "bg-primary/10 text-primary border-primary/20";
            case "new_redemption":
                return "bg-warning/10 text-warning border-warning/20";
            case "points_added":
            case "marketing_sent":
                return "bg-success/10 text-success border-success/20";
            case "client_updated_profile":
                return "bg-info/10 text-info border-info/20";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    const formatTypeLabel = (type: string) => {
        switch (type) {
            case "new_client": return "Nuevo Cliente";
            case "client_reactivated": return "Reactivación";
            case "new_redemption": return "Canje";
            case "points_added": return "Puntos Modificados";
            case "marketing_sent": return "Campaña";
            case "client_updated_profile": return "Perfil Editado";
            case "client_deleted": return "Cuenta Borrada";
            default: return type.replace(/_/g, " ").toUpperCase();
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-start gap-4 items-start sm:items-center">
                {initialLogs.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar evento, mensaje..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 bg-background/50 h-10 w-full rounded-2xl border-border"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Categorías</SelectItem>
                                <SelectItem value="system">Sistema y Ajustes</SelectItem>
                                <SelectItem value="clients">Actividad Clientes</SelectItem>
                                <SelectItem value="rewards">Premios y Canjes</SelectItem>
                                <SelectItem value="codes">Lotes de Códigos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                                <TableHead className="w-[180px] font-semibold pl-4 sm:pl-6 h-12">Fecha</TableHead>
                                <TableHead className="w-[150px] font-semibold h-12">Tipo de Evento</TableHead>
                                <TableHead className="font-semibold px-4 h-12 text-left">Mensaje de Auditoría</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                        No se encontraron registros de auditoría que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors cursor-default">
                                        <TableCell className="text-sm text-foreground/80 whitespace-nowrap pl-4 sm:pl-6 py-4">
                                            {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className={`font-medium scale-90 origin-left border-transparent ${getTypeBadgeColor(log.type)}`}>
                                                {formatTypeLabel(log.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-foreground px-4 py-4">
                                            {log.message}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="text-xs text-muted-foreground text-right px-2">
                Mostrando los últimos 1000 registros de la base de datos.
            </div>
        </div>
    );
}
