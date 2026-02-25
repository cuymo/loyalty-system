import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/admin/login");
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Mi Perfil</h2>
                <p className="text-muted-foreground">
                    Administra tus configuraciones básicas e información de cuenta.
                </p>
            </div>

            <ProfileClient
                initialName={session.user.name || ""}
                initialEmail={session.user.email || ""}
                adminId={Number(session.user.id)}
            />
        </div>
    );
}
