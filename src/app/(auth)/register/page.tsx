export const dynamic = "force-dynamic";

import { RegisterForm } from "@/features/auth/components/register-form";
import { getClientSession } from "@/lib/auth/client-jwt";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
    const session = await getClientSession();
    if (session) redirect("/client/home");

    return <RegisterForm />;
}
