/**
ID: page_0007
Página principal del cliente usando arquitectura modular de bloques.
*/

import { getClientProfile } from "@/features/client/profile/actions/client-profile";
import { getPublicSettings } from "@/features/auth/actions/client-auth";
import { getMyRedemptions } from "@/features/client/rewards/actions/client-rewards";
import { redirect } from "next/navigation";
import { ClientLoyaltyCard } from "@/features/client/home/components/client-loyalty-card";
import { ClientQuickActions } from "@/features/client/home/components/client-quick-actions";
import { ClientPendingRedemptions } from "@/features/client/home/components/client-pending-redemptions";
import { ClientAuthNotice } from "@/features/client/home/components/client-auth-notice";

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
