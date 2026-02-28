"use client";

import { useState } from "react";
import { Search, ShieldCheck, X } from "lucide-react";
import { searchRedemptionTicket } from "@/features/admin/clients/actions/admin-clients";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CheckerTab() {
    return (
        <Card className="max-w-xl mx-auto border border-border/50 shadow-sm bg-card mt-6">
            <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={32} className="text-warning" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">Verificador de Tickets</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1.5">
                    Valida la autenticidad de un canje buscando su código o número de cliente.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
                <CheckerForm />
            </CardContent>
        </Card>
    );
}

function CheckerForm() {
    const [searchQuery, setSearchQuery] = useState("");
    const [ticketResults, setTicketResults] = useState<any[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleTicketSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchRedemptionTicket(searchQuery.trim());
            setTicketResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Ingresa UUID del ticket..."
                        className="pl-9 h-10 bg-muted/30 border-none shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTicketSearch()}
                    />
                </div>
                <Button
                    variant="default"
                    onClick={handleTicketSearch}
                    disabled={isSearching}
                    className="h-10 px-6 font-bold shadow-lg shadow-primary/20"
                >
                    {isSearching ? "Buscando..." : "Validar"}
                </Button>
            </div>

            {ticketResults && (
                <div className="space-y-3 pt-2">
                    {ticketResults.length === 0 ? (
                        <div className="text-center py-10 bg-accent/20 rounded-xl border border-dashed border-border flex flex-col items-center">
                            <X size={40} className="text-muted-foreground mb-2 opacity-30" />
                            <p className="text-muted-foreground font-medium">No hay registros con este código.</p>
                        </div>
                    ) : (
                        ticketResults.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border border-border/50">
                                <div>
                                    <p className="text-[10px] font-mono text-muted-foreground">{r.ticketUuid}</p>
                                    <p className="font-bold text-foreground mt-1">{r.pointsSpent} pts deducidos</p>
                                </div>
                                <Badge className={`uppercase text-[10px] font-black px-2 py-1 ${r.status === 'approved' ? 'bg-success/20 text-success border-success/20' :
                                    r.status === 'rejected' ? 'bg-destructive/20 text-destructive border-destructive/20' :
                                        'bg-warning/20 text-warning border-warning/20'
                                    }`}>
                                    {r.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
