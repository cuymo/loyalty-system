import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCrmClients } from "@/actions/admin/crm";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CampaignsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    // Obtenemos todos los data del CRM pre-segmentados
    const clientsData = await getCrmClients();

    return <CampaignsClient initialClients={clientsData} />;
}
