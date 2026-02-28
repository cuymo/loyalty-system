"use client";

import { Users, History, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface HistoryTabProps {
    history: any[];
}

export function HistoryTab({ history }: HistoryTabProps) {
    return (
        <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                            <TableHead className="w-[200px] h-12">Fecha</TableHead>
                            <TableHead className="h-12">Campaña</TableHead>
                            <TableHead className="text-center h-12">Alcance</TableHead>
                            <TableHead className="text-center h-12">Canal</TableHead>
                            <TableHead className="text-right pr-6 h-12">Puntos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <History size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">Sin historial de campañas</p>
                                    <p className="text-sm mt-1">Tus campañas enviadas aparecerán aquí.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((campaign) => (
                                <TableRow key={campaign.id} className="hover:bg-muted/50 transition-colors border-none">
                                    <TableCell className="py-4">
                                        <div className="text-sm font-medium">
                                            {formatEcuadorDate(new Date(campaign.createdAt))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[350px]">
                                            <p className="font-semibold text-foreground truncate">{campaign.title}</p>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{campaign.body}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            <Users size={12} />
                                            {campaign.recipientsCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {campaign.sentViaWhatsapp && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 gap-1">
                                                    <MessageCircle size={10} />
                                                    WA
                                                </Badge>
                                            )}
                                            {campaign.sentViaEmail && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5">Email</Badge>
                                            )}
                                            {!campaign.sentViaWhatsapp && !campaign.sentViaEmail && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 h-5">In-App</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        {campaign.pointsGifted > 0 ? (
                                            <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 font-bold px-2 py-0.5">
                                                +{campaign.pointsGifted}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
