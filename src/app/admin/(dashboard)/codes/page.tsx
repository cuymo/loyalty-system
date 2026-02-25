/**
 * admin/codes/page.tsx
 * Descripcion: Modulo de Generacion y Listado de Codigos QR
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCodeBatches } from "@/actions/admin";
import { CodesClient } from "./codes-client";

export default async function CodesPage() {
    const session = await auth();
    if (!session) redirect("/admin/login");

    const batches = await getCodeBatches();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Codigos</h1>
                <p className="text-muted-foreground mt-1">
                    Genera y gestiona codigos QR para tarjetas fisicas
                </p>
            </div>
            <CodesClient initialBatches={batches} />
        </div>
    );
}
