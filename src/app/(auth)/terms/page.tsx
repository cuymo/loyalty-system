/**
 * (auth)/terms/page.tsx
 * Descripcion: Página de Términos y Condiciones del programa de lealtad
 * Fecha de creacion: 2026-02-23
 * Autor: Crew Zingy Dev
 */

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background px-4 py-8">
            <div className="max-w-lg mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={14} />
                    Volver
                </button>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Términos y Condiciones
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Última actualización: 23 de febrero de 2026
                    </p>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">1. Objeto</h2>
                        <p>
                            Los presentes Términos y Condiciones regulan el uso del programa de
                            lealtad &quot;Crew Zingy&quot; (en adelante, &quot;el Programa&quot;), operado
                            por el establecimiento comercial asociado. Al registrarte, aceptas
                            íntegramente estos términos.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">2. Registro</h2>
                        <p>
                            Para participar en el Programa debes registrarte proporcionando un
                            número de teléfono válido y eligiendo un nombre de usuario único.
                            Cada persona puede tener una sola cuenta activa. El uso de datos
                            falsos o la creación de múltiples cuentas es motivo de suspensión.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">3. Acumulación de Puntos</h2>
                        <p>
                            Los puntos se acumulan mediante el escaneo de códigos QR válidos
                            proporcionados por el establecimiento. Cada código tiene un valor en
                            puntos predefinido y solo puede ser usado una vez. Los códigos tienen
                            fecha de caducidad, después de la cual no podrán ser canjeados.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">4. Canje de Premios</h2>
                        <p>
                            Los puntos acumulados pueden canjearse por los premios disponibles en
                            el catálogo. Los canjes están sujetos a disponibilidad y requieren
                            aprobación del establecimiento. Una vez aprobado un canje, los puntos
                            correspondientes serán descontados de tu saldo de forma permanente.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">5. Naturaleza de los Puntos</h2>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Los puntos no tienen valor monetario.</li>
                            <li>Los puntos no son transferibles entre cuentas.</li>
                            <li>Los puntos no son reembolsables.</li>
                            <li>El establecimiento puede modificar el valor de los premios en cualquier momento.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">6. Niveles VIP y Sistema de Referidos</h2>
                        <p>
                            Tu cuenta acumula &quot;Puntos Históricos&quot; permanentemente. Al superar ciertos umbrales, alcanzarás nuevos <strong>Niveles VIP</strong>, desbloqueando el acceso a premios exclusivos. Estos umbrales son definidos por el administrador.
                        </p>
                        <p className="mt-2">
                            Además, puedes ganar puntos invitando a amigos mediante el <strong>Sistema de Referidos</strong> usando el código asociado a tu cuenta. El número de recompensas por referir usuarios está sujeto a un límite máximo predefinido, tras el cual las invitaciones seguirán funcionando pero sin otorgar bono al referidor.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">7. Regalos de Cumpleaños</h2>
                        <p>
                            Al registrarte, debes ingresar tu fecha de nacimiento. El sistema te otorgará automáticamente un bono de puntos en tu cumpleaños. El establecimiento se reserva el derecho de modificar o suspender este bono en cualquier momento.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">8. Nombre de Usuario</h2>
                        <p>
                            Puedes cambiar tu nombre de usuario hasta 2 veces por año. El nombre
                            debe contener solo letras minúsculas, números y guiones bajos. Nombres
                            ofensivos o inapropiados serán rechazados.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">9. Eliminación y Exportación de Cuenta</h2>
                        <p>
                            Puedes pedir la eliminación de tu cuenta en cualquier momento desde tu perfil. Al
                            hacerlo, perderás todos tus puntos acumulados, historial de canjes y
                            derecho a reclamar premios pendientes de forma irreversible.
                        </p>
                        <p className="mt-2">
                            Si deseas una copia en formato compatible de toda la información histórica que este programa ha recopilado de ti, incluyendo tu información de contacto, saldo, Puntos VIP y referidos, puedes solicitar una <strong>Descarga de Datos</strong>. Deberás presentar una petición directamente al administrador comercial para procesarla manualmente y enviarte la documentación.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">10. Uso Indebido</h2>
                        <p>
                            El establecimiento se reserva el derecho de suspender o cancelar
                            cuentas en caso de uso fraudulento, manipulación de códigos, creación
                            de cuentas múltiples o cualquier conducta que atente contra la
                            integridad del Programa.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">9. Modificaciones</h2>
                        <p>
                            El establecimiento puede modificar estos términos en cualquier
                            momento. Las modificaciones serán notificadas a través de la
                            aplicación. El uso continuado del Programa tras las modificaciones
                            implica su aceptación.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">10. Legislación Aplicable</h2>
                        <p>
                            Estos términos se rigen por la legislación vigente de la República
                            del Ecuador. Cualquier controversia será resuelta ante las autoridades
                            competentes del domicilio del establecimiento.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">11. Comunicaciones y WhatsApp</h2>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Al participar en el Programa, aceptas que el establecimiento utilice tu número de teléfono para enviarte notificaciones transaccionales obligatorias (por ejemplo, confirmaciones y recibos de canje de premios, validación de cuenta o notificaciones de seguridad), <strong>incluso si has desactivado la recepción de notificaciones</strong> en tu perfil.</li>
                            <li>A través de la sección "Perfil", podrás activar o desactivar en cualquier momento la recepción de mensajes promocionales, ofertas masivas o avisos de nuevos premios.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
