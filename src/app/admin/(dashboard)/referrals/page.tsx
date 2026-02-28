/**
 * admin/referrals/page.tsx
 * Descripcion: Modulo unificado de Sistema de Referidos
 * Fecha de creacion: 2026-02-26
 * Autor: Crew Zingy Dev
 */

import { getReferralSettings, getReferralHistory } from "@/features/referrals/actions/admin-referrals";
import { ReferralsClient } from "./referrals-client"; // component rendering ui

export default async function ReferralsPage() {
    const settings = await getReferralSettings();
    const history = await getReferralHistory();

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Referidos</h1>
                <p className="text-muted-foreground">
                    Control absoluto sobre el programa de invitaciones. Configura las reglas, los premios, y visualiza el historial.
                </p>
            </div>
            <ReferralsClient initialSettings={settings} history={history} />
        </div>
    );
}
