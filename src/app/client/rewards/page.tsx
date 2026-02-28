/**
 * (client)/rewards/page.tsx
 * Descripcion: Catalogo de premios canjeables + historial de canjes
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion: Añadido sistema de tabs con pestaña "Canjeados"
 */

import { getClientProfile } from "@/features/client/profile/actions/client-profile";
import { getAvailableRewards } from "@/features/client/rewards/actions/client-rewards";
import { getMyRedemptions } from "@/features/client/rewards/actions/client-rewards";
import { redirect } from "next/navigation";
import { RewardsClientView } from "@/features/client/rewards/components/rewards-view";
import { RewardsPageClient } from "@/features/client/rewards/components/rewards-page-client";

export default async function ClientRewardsPage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    const [rewardsList, myRedemptions] = await Promise.all([
        getAvailableRewards(),
        getMyRedemptions(),
    ]);

    return (
        <div className="max-w-md mx-auto px-4 pt-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Premios</h1>
                    <p className="text-muted-foreground text-sm">Canjea tus puntos</p>
                </div>
                <div className="px-3 py-1.5 bg-card border border-border rounded-xl">
                    <p className="text-foreground font-bold text-sm">{client.points} pts</p>
                </div>
            </div>
            <RewardsPageClient
                rewards={rewardsList}
                clientPoints={client.points}
                clientVip={client.vip}
                wantsMarketing={client.wantsMarketing}
                wantsTransactional={client.wantsTransactional}
                redemptions={myRedemptions}
            />
        </div>
    );
}
