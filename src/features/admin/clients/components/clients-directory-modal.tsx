"use client";

import { useState, useMemo } from "react";
import { useModalStore } from "@/lib/modal-store";
import { Users, Search, Download } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface ClientsDirectoryModalProps {
    initialClients: any[];
}

export function ClientsDirectoryModal({ initialClients }: ClientsDirectoryModalProps) {
    const { activeModal, openModal, closeModal } = useModalStore();
    const [clientFilter, setClientFilter] = useState("");

    const isModalOpen = activeModal === "clients";

    const filteredClients = useMemo(() => {
        if (!clientFilter.trim()) return initialClients;
        const q = clientFilter.toLowerCase().trim();
        return initialClients.filter((c) => {
            const matchUser = c.username.toLowerCase().includes(q);
            const matchPhone = c.phone.includes(q);
            const matchDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" }).toLowerCase().includes(q)
                : false;
            return matchUser || matchPhone || matchDate;
        });
    }, [initialClients, clientFilter]);

    const handleExportCSV = () => {
        if (!initialClients.length) {
            toast.error("No hay clientes para exportar");
            return;
        }

        const headers = ["ID", "Usuario", "Teléfono", "Puntos Actuales", "Puntos Historicos", "Fecha de Nacimiento", "Referido Por", "Accesos Referidos", "Fecha Creacion", "Inicios Sesión", "Último Acceso", "Códigos Canjeados", "Canjes Premios"];

        const rows = initialClients.map(c => [
            c.id,
            c.username,
            c.phone,
            c.points,
            c.lifetimePoints || 0,
            c.birthDate || "N/A",
            c.referredBy || "N/A",
            c.referralCount || 0,
            c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-EC") : "N/A",
            c.loginCount || 0,
            c.lastLoginAt ? formatEcuadorDate(new Date(c.lastLoginAt)) : "N/A",
            c.codesRedeemed || 0,
            c.totalRedemptions || 0
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(row => row.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `clientes_zingy_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Archivo CSV generado exitosamente");
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
                closeModal();
                setClientFilter("");
            }
        }}>
            <DialogContent className="max-w-4xl flex flex-col max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Users size={24} className="text-info" />
                        Directorio y Base de Datos de Clientes
                    </DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto custom-scrollbar p-6 shrink flex-1 space-y-4">
                    {initialClients.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay clientes registrados en el sistema</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Header Tools */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por usuario o número..."
                                        value={clientFilter}
                                        onChange={(e) => setClientFilter(e.target.value)}
                                        className="pl-9 bg-background/50"
                                    />
                                </div>
                                <Button variant="outline" onClick={handleExportCSV} className="shrink-0 gap-2">
                                    <Download size={16} />
                                    Exportar CSV
                                </Button>
                            </div>

                            {clientFilter && (
                                <p className="text-xs text-muted-foreground font-medium pl-1">{filteredClients.length} de {initialClients.length} resultados</p>
                            )}

                            {/* Table layout */}
                            <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="pl-4 sm:pl-6 w-[200px] sm:w-[400px]">Perfil de Usuario</TableHead>
                                            <TableHead className="text-right pr-4 sm:pr-8">Balance de Puntos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredClients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                                                    No se encontraron clientes con esos parámetros
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredClients.map((client) => (
                                                <TableRow
                                                    key={client.id}
                                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                                >
                                                    <TableCell className="pl-4 sm:pl-6" onClick={() => openModal("client-detail", { client })}>
                                                        <div className="flex items-center gap-4">
                                                            <img
                                                                src={`/avatars/${client.avatarSvg}`}
                                                                alt={client.username}
                                                                className="w-10 h-10 rounded-full border border-border object-cover shrink-0"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "/avatars/default.svg";
                                                                }}
                                                            />
                                                            <div>
                                                                <span className="font-semibold text-foreground truncate block">
                                                                    {client.username}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground truncate block mt-0.5">
                                                                    {client.phone}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4 sm:pr-8" onClick={() => openModal("client-detail", { client })}>
                                                        <Badge variant="secondary" className="font-bold bg-accent">{client.points} pts</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
