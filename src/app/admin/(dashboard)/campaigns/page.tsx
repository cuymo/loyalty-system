import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCrmClients, getClientGroups, getClientGroupMembers, getCampaignsHistory } from "@/actions/admin/crm";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    // Obtenemos todos los data del CRM pre-segmentados
    const clientsData = await getCrmClients();
    const groups = await getClientGroups();
    const groupMemberships = await getClientGroupMembers();
    const historyData = await getCampaignsHistory();

    return (
        <div className="p-4 md:p-8 space-y-6 flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Campañas y Grupos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestión de envíos y segmentación de clientes.
                    </p>
                </div>
            </div>
            <CampaignsClient initialClients={clientsData} initialGroups={groups} initialMemberships={groupMemberships} initialHistory={historyData} />
        </div>
    );
}
