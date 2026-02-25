/**
 * admin/rewards/page.tsx
 * Descripcion: Modulo CRUD de Premios (listado, crear, editar, eliminar)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRewards } from "@/actions/admin";
import { RewardsClient } from "./rewards-client";

export default async function RewardsPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const rewardsList = await getRewards();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Premios</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona el catalogo de recompensas
                    </p>
                </div>
            </div>
            <RewardsClient initialRewards={rewardsList} />
        </div>
    );
}
