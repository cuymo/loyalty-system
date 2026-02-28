export const dynamic = "force-dynamic";

import ClientLoginPage from "@/features/auth/components/client-login-form";
import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await getClientSession();
    if (session) redirect("/client/home");

    return <ClientLoginPage />;
}
