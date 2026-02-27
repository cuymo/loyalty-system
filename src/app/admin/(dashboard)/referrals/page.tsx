/**
 * admin/referrals/page.tsx
 * Descripcion: Modulo unificado de Sistema de Referidos
 * Fecha de creacion: 2026-02-26
 * Autor: Crew Zingy Dev
 */

import { getReferralSettings, getReferralHistory } from "@/actions/admin/referrals";
import { ReferralsClient } from "./referrals-client"; // component rendering ui

export default async function ReferralsPage() {
    const settings = await getReferralSettings();
    const history = await getReferralHistory();

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Referidos</h1>
                    <p className="text-muted-foreground mt-1">
                        Control absoluto sobre el programa de invitaciones. Configura las reglas, los premios, y visualiza el historial en tiempo real de quién ha invitado a quién para prevenir fraudes.
                    </p>
                </div>
            </div>
            <ReferralsClient initialSettings={settings} history={history} />
        </div>
    );
}
