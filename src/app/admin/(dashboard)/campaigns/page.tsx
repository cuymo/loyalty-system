import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCrmClients, getClientGroups, getClientGroupMembers, getCampaignsHistory } from "@/features/admin/campaigns/actions/admin-campaigns";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const clientsData = await getCrmClients();
    const groups = await getClientGroups();
    const groupMemberships = await getClientGroupMembers();
    const historyData = await getCampaignsHistory();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Campañas y Grupos</h1>
                <p className="text-muted-foreground">
                    Segmenta tu audiencia y lanza campañas de fidelización.
                </p>
            </div>
            <CampaignsClient initialClients={clientsData} initialGroups={groups} initialMemberships={groupMemberships} initialHistory={historyData} />
        </div>
    );
}
