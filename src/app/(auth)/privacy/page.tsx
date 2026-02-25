/**
 * (auth)/privacy/page.tsx
 * Descripcion: Página de Política de Privacidad LOPDP Ecuador
 * Fecha de creacion: 2026-02-23
 * Autor: Crew Zingy Dev
 */

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
                        Política de Privacidad
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Última actualización: 23 de febrero de 2026
                    </p>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">1. Responsable del Tratamiento</h2>
                        <p>
                            El responsable del tratamiento de tus datos personales es el
                            establecimiento comercial que opera el programa de lealtad
                            &quot;Crew Zingy&quot;. Esta política se rige por la Ley Orgánica de
                            Protección de Datos Personales del Ecuador (LOPDP) y las normas
                            internacionales aplicables.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">2. Datos Recopilados</h2>
                        <p>Recopilamos únicamente los datos necesarios para el funcionamiento del Programa:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><span className="text-foreground font-medium">Número de teléfono</span> — para autenticación vía OTP</li>
                            <li><span className="text-foreground font-medium">Nombre de usuario</span> — pseudónimo elegido por el usuario</li>
                            <li><span className="text-foreground font-medium">Avatar</span> — imagen de perfil seleccionada</li>
                            <li><span className="text-foreground font-medium">Fecha de nacimiento</span> — para activar regalos automáticos de cumpleaños</li>
                            <li><span className="text-foreground font-medium">Código de referido (opcional)</span> — para vincular tu cuenta a la de quien te invitó</li>
                            <li><span className="text-foreground font-medium">Puntos y canjes</span> — historial transaccional del programa</li>
                            <li><span className="text-foreground font-medium">Preferencia de notificaciones</span> — consentimiento para WhatsApp</li>
                        </ul>
                        <p>
                            No recopilamos datos sensibles como información biométrica, de
                            salud, orientación sexual, creencias religiosas o políticas.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">3. Finalidad del Tratamiento</h2>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Gestionar tu cuenta y participación en el programa de lealtad</li>
                            <li>Verificar tu identidad mediante código OTP</li>
                            <li>Procesar la acumulación de puntos y canje de premios</li>
                            <li>Enviarte notificaciones sobre premios y novedades (solo con tu consentimiento)</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">4. Base Legal</h2>
                        <p>
                            El tratamiento de tus datos se fundamenta en tu consentimiento
                            expreso (Art. 7 LOPDP), otorgado al aceptar esta política durante
                            el registro. Puedes revocar este consentimiento en cualquier momento
                            eliminando tu cuenta.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">5. Almacenamiento y Seguridad</h2>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Los datos se almacenan en servidores protegidos con cifrado</li>
                            <li>Las sesiones utilizan tokens JWT con expiración de 3 días</li>
                            <li>Las contraseñas de administrador se almacenan con hash bcrypt</li>
                            <li>Las cookies de sesión son httpOnly y secure en producción</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">6. Retención de Datos</h2>
                        <p>
                            Tus datos se mantienen mientras tu cuenta esté activa. Al eliminar
                            tu cuenta, tus datos personales (nombre, avatar) se anonimizan
                            inmediatamente. Los registros transaccionales se conservan de forma
                            anónima para fines estadísticos del establecimiento.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">7. Tus Derechos (ARCO+P)</h2>
                        <p>
                            Conforme a la LOPDP (Arts. 17-22), tienes los siguientes derechos:
                        </p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><span className="text-foreground font-medium">Acceso</span> — consultar tus datos desde tu perfil</li>
                            <li><span className="text-foreground font-medium">Rectificación</span> — modificar tu nombre y avatar</li>
                            <li><span className="text-foreground font-medium">Cancelación</span> — eliminar tu cuenta</li>
                            <li><span className="text-foreground font-medium">Oposición</span> — desactivar notificaciones por WhatsApp</li>
                            <li><span className="text-foreground font-medium">Portabilidad</span> — Puedes solicitar la descarga completa de tus datos transaccionales y de perfil en tu cuenta enviando una solicitud directa al administrador del establecimiento. El administrador procesará esta petición manualmente y te proveerá de un archivo seguro con tu información.</li>
                        </ul>
                        <p>
                            Para ejercer tus derechos de Acceso, Rectificación, Cancelación u Oposición, puedes hacerlo directamente desde la
                            aplicación o contactando al establecimiento.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">8. Comunicaciones</h2>
                        <p>
                            Solo enviaremos notificaciones por WhatsApp si has otorgado tu
                            consentimiento explícito. Puedes activar o desactivar esta opción
                            en cualquier momento desde tu perfil, sin que esto afecte tu
                            participación en el Programa.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">9. Cookies</h2>
                        <p>
                            Utilizamos únicamente cookies técnicas necesarias para mantener tu
                            sesión activa. No utilizamos cookies de rastreo, analíticas ni
                            publicitarias.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-foreground font-semibold text-base">10. Contacto</h2>
                        <p>
                            Para cualquier consulta relacionada con la protección de tus datos
                            personales, puedes contactar al establecimiento directamente. De
                            conformidad con la LOPDP, tienes derecho a presentar una reclamación
                            ante la Superintendencia de Protección de Datos Personales del Ecuador.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
