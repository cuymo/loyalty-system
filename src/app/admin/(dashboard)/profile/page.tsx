import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";
import { getAdminProfile } from "@/actions/admin";

export default async function ProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/admin/login");
    }

    const admin = await getAdminProfile(Number(session.user.id));

    if (!admin) {
        redirect("/admin/login");
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground">
                    Administra tus configuraciones básicas e información de cuenta.
                </p>
            </div>
            <ProfileClient
                initialName={admin.name || ""}
                initialFirstName={admin.firstName || ""}
                initialLastName={admin.lastName || ""}
                initialEmail={admin.email || ""}
                adminId={admin.id}
            />
        </div>
    );
}
