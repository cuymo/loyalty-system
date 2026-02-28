"use client";

import { useState } from "react";
import { searchRedemptionTicket } from "@/actions/admin";
import { ShieldCheck, Search } from "lucide-react";
import { useModalStore } from "@/lib/modal-store";
import type { Redemption } from "@/types";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = (status: string) => {
    switch (status) {
        case "approved":
            return { label: "Aprobado", variant: "default" as const };
        case "rejected":
            return { label: "Rechazado", variant: "destructive" as const };
        default:
            return { label: "Pendiente", variant: "outline" as const };
    }
};

export function CheckerModal() {
    const { activeModal, closeModal } = useModalStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [ticketResults, setTicketResults] = useState<Redemption[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const isModalOpen = activeModal === "checker";

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
        <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-warning" />
                        Comprobador (Antifraude)
                    </DialogTitle>
                </DialogHeader>
                <div className="flex gap-2 mb-2">
                    <Input
                        placeholder="Buscar ticket UUID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTicketSearch()}
                    />
                    <Button
                        onClick={handleTicketSearch}
                        disabled={isSearching}
                        variant="secondary"
                    >
                        <Search />
                    </Button>
                </div>
                {ticketResults && (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                        {ticketResults.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-6">
                                No se encontraron canjes con ese ticket.
                            </p>
                        ) : (
                            ticketResults.map((r) => {
                                const sc = statusConfig(r.status);
                                return (
                                    <div
                                        key={r.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card border border-border rounded-lg gap-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs text-muted-foreground truncate">
                                                {r.ticketUuid}
                                            </p>
                                            <p className="text-sm font-medium text-foreground mt-1">
                                                Puntos Deduccidos: {r.pointsSpent} pts
                                            </p>
                                        </div>
                                        <Badge variant={sc.variant}>{sc.label}</Badge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
