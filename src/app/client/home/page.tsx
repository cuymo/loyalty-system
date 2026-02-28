/**
ID: page_0007
Página principal del cliente usando arquitectura modular de bloques.
*/

import { getClientProfile } from "@/actions/client";
import { getPublicSettings } from "@/actions/client";
import { getMyRedemptions } from "@/actions/client";
import { redirect } from "next/navigation";
import { ClientLoyaltyCard } from "@/features/clients/components/home/client-loyalty-card";
import { ClientQuickActions } from "@/features/clients/components/home/client-quick-actions";
import { ClientPendingRedemptions } from "@/features/clients/components/home/client-pending-redemptions";
import { ClientAuthNotice } from "@/features/clients/components/home/client-auth-notice";

export default async function ClientHomePage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    const [redemptions, settings] = await Promise.all([
        getMyRedemptions(),
        getPublicSettings(),
    ]);
    const pendingRedemptions = redemptions.filter((r) => r.status === "pending");
    const notice = settings.notice_auth;

    return (
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-6 animate-in fade-in duration-500">
            <ClientLoyaltyCard client={client} />
            <ClientAuthNotice notice={notice} />
            <ClientQuickActions />
            <ClientPendingRedemptions redemptions={pendingRedemptions} />
        </div>
    );
}
