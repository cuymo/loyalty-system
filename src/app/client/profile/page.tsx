/**
 * (client)/profile/page.tsx
 * Descripcion: Pagina de perfil del cliente con selector de avatar y logout
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { getClientProfile } from "@/features/client/profile/actions/client-profile";
import { getAvailableAvatars } from "@/features/auth/actions/client-auth";
import { getReferralProgress } from "@/features/client/referrals/actions/client-referrals-logic";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/features/client/profile/components/profile-client";

export default async function ProfilePage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    const avatars = await getAvailableAvatars();
    const referralProgress = await getReferralProgress(client.id);

    return (
        <div className="max-w-md mx-auto px-4 pt-8">
            <ProfileClient client={client} avatars={avatars} referralProgress={referralProgress} />
        </div>
    );
}
