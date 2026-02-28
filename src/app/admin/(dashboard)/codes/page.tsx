/**
 * admin/codes/page.tsx
 * Descripcion: Modulo de Generacion y Listado de Codigos QR
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCodeBatches } from "@/features/admin/codes/actions/admin-codes";
import { CodesClient } from "./codes-client";

export default async function CodesPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const batches = await getCodeBatches();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Códigos</h1>
                <p className="text-muted-foreground">
                    Genera y gestiona codigos QR para tarjetas fisicas
                </p>
            </div>
            <CodesClient initialBatches={batches} />
        </div>
    );
}
