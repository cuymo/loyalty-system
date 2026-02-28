"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useModalStore } from "@/lib/modal-store";
import { Users, ShieldCheck, Gift, Download } from "lucide-react";
import { approveRedemption } from "@/actions/admin";
import { toast } from "@/lib/toast";

// Modular tab components
import { ClientsStatsCards } from "@/features/admin/clients/components/stats-cards";
import { ClientsDirectoryTab } from "@/features/admin/clients/components/directory-tab";
import { PendingTab } from "@/features/admin/clients/components/pending-tab";
import { CheckerTab } from "@/features/admin/clients/components/checker-tab";

// Modal components
import { ClientDetailModal } from "@/features/admin/clients/components/client-detail-modal";
import { BlockClientAlert } from "@/features/admin/clients/components/block-client-alert";
import { DeleteClientAlert } from "@/features/admin/clients/components/delete-client-alert";
import { RejectRedemptionModal } from "@/features/admin/clients/components/reject-redemption-modal";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ClientsClientProps {
    initialClients: any[];
    initialPendingRedemptions: any[];
}

export function ClientsClient({ initialClients, initialPendingRedemptions }: ClientsClientProps) {
    const router = useRouter();
    const { openModal } = useModalStore();
    const searchParams = useSearchParams();

    const [pendingRedemptions, setPendingRedemptions] = useState(initialPendingRedemptions || []);
    const [isProcessingAct, setIsProcessingAct] = useState<number | null>(null);

    const totalPoints = initialClients.reduce((acc, curr) => acc + curr.points, 0);

    useEffect(() => {
        const highlightId = searchParams.get("highlight");
        const code = searchParams.get("code");
        if (highlightId && initialClients.length > 0) {
            const client = initialClients.find(c => c.id === Number(highlightId));
            if (client) {
                openModal("client-detail", {
                    client,
                    highlightCode: code || undefined
                });
                window.history.replaceState({}, "", "/admin/clients");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, initialClients]);

    const handleApproveRedemption = async (id: number) => {
        try {
            await approveRedemption(id);
            toast.success("Canje aprobado exitosamente");
            setPendingRedemptions(prev => prev.filter(p => p.id !== id));
            router.refresh();
        } catch {
            toast.error("Error al aprobar canje");
        }
    };

    const handleRejectClick = (id: number) => {
        setIsProcessingAct(id);
        openModal("reject-redemption", {
            redemptionId: id,
            onSuccess: (deletedId: number) => {
                setPendingRedemptions(prev => prev.filter(p => p.id !== deletedId));
                setIsProcessingAct(null);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <ClientsStatsCards
                totalClients={initialClients.length}
                pendingCount={pendingRedemptions.length}
                totalPoints={totalPoints}
            />

            {/* Tabs */}
            <Tabs defaultValue="directory" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1 h-12">
                        <TabsTrigger value="directory" className="px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users size={16} className="mr-2" />
                            Directorio
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm relative">
                            <Gift size={16} className="mr-2" />
                            Canjes
                            {pendingRedemptions.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive text-[10px] text-white items-center justify-center font-bold">
                                        {pendingRedemptions.length}
                                    </span>
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="checker" className="px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ShieldCheck size={16} className="mr-2" />
                            Verificador
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-10 px-4">
                            <Download size={16} className="mr-2" />
                            Exportar
                        </Button>
                    </div>
                </div>

                <TabsContent value="directory" className="border-none p-0 outline-none">
                    <ClientsDirectoryTab clients={initialClients} />
                </TabsContent>

                <TabsContent value="pending" className="border-none p-0 outline-none">
                    <PendingTab
                        pendingRedemptions={pendingRedemptions}
                        initialClients={initialClients}
                        isProcessingAct={isProcessingAct}
                        onApprove={handleApproveRedemption}
                        onReject={handleRejectClick}
                    />
                </TabsContent>

                <TabsContent value="checker" className="border-none p-0 outline-none">
                    <CheckerTab />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <ClientDetailModal />
            <BlockClientAlert />
            <DeleteClientAlert />
            <RejectRedemptionModal />
        </div>
    );
}
