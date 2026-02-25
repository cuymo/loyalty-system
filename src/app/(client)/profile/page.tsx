/**
 * (client)/profile/page.tsx
 * Descripcion: Pagina de perfil del cliente con selector de avatar y logout
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { getClientProfile, getAvailableAvatars } from "@/actions/client";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
    const client = await getClientProfile();
    if (!client) redirect("/login");

    const avatars = await getAvailableAvatars();

    return (
        <div className="max-w-md mx-auto px-4 pt-8">
            <ProfileClient client={client} avatars={avatars} />
        </div>
    );
}
