"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, History, Tag } from "lucide-react";

import { useModalStore } from "@/lib/modal-store";
import { getClientMovements } from "@/actions/admin";
import { toast } from "@/lib/toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Modular sub-components
import { CampaignStatsCards } from "@/features/campaigns/components/stats-cards";
import { AudienceTab } from "@/features/campaigns/components/audience-tab";
import { HistoryTab } from "@/features/campaigns/components/history-tab";

// Modal components
import { GroupsModal } from "@/features/campaigns/components/groups-modal";
import { AssignGroupModal } from "@/features/campaigns/components/assign-group-modal";
import { CampaignCreatorModal } from "@/features/campaigns/components/campaign-creator-modal";
import { ClientDetailDrawer } from "@/features/campaigns/components/client-detail-drawer";

interface CampaignsClientProps {
    initialClients: any[];
    initialGroups: any[];
    initialMemberships: any[];
    initialHistory?: any[];
}

export function CampaignsClient({ initialClients, initialGroups, initialMemberships, initialHistory = [] }: CampaignsClientProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [clientMovements, setClientMovements] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");

    const { openModal } = useModalStore();

    // --- Computed Stats ---
    const totalReach = useMemo(() => {
        return initialHistory.reduce((acc, c) => acc + (c.recipientsCount || 0), 0);
    }, [initialHistory]);

    const totalPointsGifted = useMemo(() => {
        return initialHistory.reduce((acc, c) => acc + (c.pointsGifted || 0), 0);
    }, [initialHistory]);

    const marketingOptIn = useMemo(() => {
        return initialClients.filter(c => c.wantsMarketing).length;
    }, [initialClients]);

    // --- Handlers ---
    const handleLaunchClick = () => {
        const theSelectedClients = initialClients.filter(c => selectedIds.includes(c.id));
        openModal("campaign_creator", { selectedIds, selectedClients: theSelectedClients });
    };

    useEffect(() => {
        const handleCampaignDone = () => setSelectedIds([]);
        window.addEventListener("campaign_done", handleCampaignDone);
        return () => window.removeEventListener("campaign_done", handleCampaignDone);
    }, []);

    const handleClientDetail = async (client: any, filter: string) => {
        setIsLoadingHistory(true);
        openModal("client_campaign_detail", { client, activeFilter: filter });
        try {
            const movements = await getClientMovements(client.id);
            setClientMovements(movements);
        } catch {
            toast.error("Error al cargar historial del cliente");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <CampaignStatsCards
                totalCampaigns={initialHistory.length}
                totalReach={totalReach}
                totalPointsGifted={totalPointsGifted}
                marketingOptIn={marketingOptIn}
                totalClients={initialClients.length}
            />

            {/* Tabs */}
            <Tabs defaultValue="directorio" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1 h-12">
                        <TabsTrigger value="directorio" className="px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Users size={16} className="mr-2" />
                            Audiencia
                        </TabsTrigger>
                        <TabsTrigger value="historial" className="px-6 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <History size={16} className="mr-2" />
                            Historial
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openModal("manage_groups")} className="h-10 px-4 gap-2">
                            <Tag size={16} />
                            Grupos
                        </Button>
                    </div>
                </div>

                <TabsContent value="directorio" className="border-none p-0 outline-none mt-0">
                    <AudienceTab
                        clients={initialClients}
                        groups={initialGroups}
                        memberships={initialMemberships}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        onLaunch={handleLaunchClick}
                        onClientDetail={handleClientDetail}
                    />
                </TabsContent>

                <TabsContent value="historial" className="border-none p-0 outline-none mt-0">
                    <HistoryTab history={initialHistory} />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <GroupsModal initialGroups={initialGroups} activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
            <AssignGroupModal initialGroups={initialGroups} onSuccess={() => setSelectedIds([])} />
            <CampaignCreatorModal />
            <ClientDetailDrawer isLoadingHistory={isLoadingHistory} clientMovements={clientMovements} />
        </div>
    );
}
