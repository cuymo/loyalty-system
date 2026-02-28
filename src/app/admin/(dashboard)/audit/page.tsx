import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminNotifications } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AuditLogClient } from "./audit-client";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
    const session = await auth();
    if (!session) {
        redirect("/admin/login");
    }

    // Fetch the 1000 most recent audit logs
    const logs = await db
        .select()
        .from(adminNotifications)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(1000);

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Registro de Actividad</h1>
                <p className="text-muted-foreground">
                    Historial de auditoría de todas las acciones del sistema y clientes.
                </p>
            </div>
            <AuditLogClient initialLogs={logs} />
        </div>
    );
}
