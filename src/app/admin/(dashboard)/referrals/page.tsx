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
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Módulo de Referidos
                </h1>
            </div>

            <p className="text-muted-foreground text-sm max-w-2xl">
                Control absoluto sobre el programa de invitaciones. Configura las reglas, los premios, los límites mensuales y visualiza el historial en tiempo real de quién ha invitado a quién para prevenir fraudes.
            </p>

            <ReferralsClient initialSettings={settings} history={history} />
        </div>
    );
}
