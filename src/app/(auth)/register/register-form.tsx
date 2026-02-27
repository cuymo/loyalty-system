/**
 * (auth)/register/register-form.tsx
 * Descripcion: Formulario de registro con selector de avatar, T&C y WhatsApp
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion: Añadidos checkboxes de T&C (obligatorio) y WhatsApp (opcional)
 */

"use client";

import { useState, useEffect } from "react";
import { registerClient, getAvailableAvatars } from "@/actions/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone") || "";
    const refParam = searchParams.get("ref");

    const [username, setUsername] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [referredByCode, setReferredByCode] = useState(refParam ? refParam.replace(/\D/g, "") : "");
    const [avatarSvg, setAvatarSvg] = useState("default.svg");
    const [avatars, setAvatars] = useState<string[]>([]);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [wantsMarketing, setWantsMarketing] = useState(true);
    const [wantsTransactional, setWantsTransactional] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!phone) {
            router.push("/login");
            return;
        }
        getAvailableAvatars().then(setAvatars);
    }, [phone, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username.length < 3) {
            setError("Minimo 3 caracteres");
            return;
        }
        if (!birthDate) {
            setError("La fecha de nacimiento es obligatoria");
            return;
        }
        if (!acceptedTerms) {
            setError("Debes aceptar los Términos y la Política de Privacidad");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const result = await registerClient({
                phone,
                username,
                avatarSvg,
                birthDate,
                referredByCode: referredByCode ? parseInt(referredByCode) : undefined,
                wantsMarketing: wantsMarketing,
                wantsTransactional: wantsTransactional,
            });
            if (!result.success) {
                setError(result.error || "Error al registrar");
                return;
            }
            router.push("/");
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Crear Perfil</h1>
                    <p className="text-muted-foreground text-sm">
                        Elige tu nombre de usuario y avatar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Avatar</label>
                        <div className="flex gap-3 overflow-x-auto pb-4 px-1 -mx-1 snap-x scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                            {avatars.map((avatar) => (
                                <button
                                    key={avatar}
                                    type="button"
                                    onClick={() => setAvatarSvg(avatar)}
                                    className={`relative shrink-0 w-16 h-16 rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden snap-center ${avatarSvg === avatar
                                        ? "border-primary bg-primary/10 shadow-sm"
                                        : "border-border bg-card hover:border-border/80"
                                        }`}
                                >
                                    <Image
                                        src={`/avatars/${avatar}`}
                                        alt={avatar.replace(".svg", "").replace(/-/g, " ")}
                                        width={48}
                                        height={48}
                                        className="object-contain"
                                    />
                                </button>
                            ))}
                            {avatars.length === 0 && (
                                <p className="w-full text-muted-foreground text-sm text-center py-4">
                                    No hay avatares disponibles
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            Nombre de Usuario <span className="text-destructive text-lg leading-none">*</span>
                        </label>
                        <input
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                                )
                            }
                            placeholder="mi_nombre"
                            disabled={isLoading}
                            maxLength={50}
                            className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 transition-all font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Solo letras, numeros y guion bajo
                        </p>
                    </div>

                    {/* Fecha de Nacimiento */}
                    <div className="space-y-2 pt-1">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            Fecha de Nacimiento <span className="text-destructive text-lg leading-none">*</span>
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal ${!birthDate ? "text-muted-foreground" : ""}`}
                                >
                                    <CalendarIcon size={16} className="mr-2 opacity-50" />
                                    {birthDate
                                        ? format(new Date(birthDate + "T12:00:00"), "PPP", { locale: es })
                                        : "Selecciona una fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    captionLayout="dropdown"
                                    fromYear={1900}
                                    toYear={new Date().getFullYear()}
                                    selected={birthDate ? new Date(birthDate + "T12:00:00") : undefined}
                                    onSelect={(date) =>
                                        setBirthDate(date ? format(date, "yyyy-MM-dd") : "")
                                    }
                                    defaultMonth={birthDate ? new Date(birthDate + "T12:00:00") : new Date(2000, 0, 1)}
                                    disabled={{ after: new Date() }}
                                    className="p-3 pointer-events-auto"
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-[11px] text-muted-foreground">
                            Para darte regalos en tu día especial (No público)
                        </p>
                    </div>

                    {/* Codigo de Referido (Opcional) */}
                    <div className="space-y-2 pt-1">
                        <label className="text-sm font-medium text-muted-foreground">
                            Código de Referido <span className="text-[10px] text-muted-foreground/60">(Opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={referredByCode}
                            onChange={(e) =>
                                setReferredByCode(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="Ej. 12345"
                            disabled={isLoading}
                            className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 transition-all font-mono tracking-widest"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Si un amigo te invitó, ingresa su código para ganar puntos.
                        </p>
                    </div>

                    {/* Términos y Condiciones */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="terms"
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                className="mt-0.5"
                            />
                            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                Acepto los{" "}
                                <Link
                                    href="/terms"
                                    className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                                >
                                    Términos y Condiciones
                                </Link>{" "}
                                y la{" "}
                                <Link
                                    href="/privacy"
                                    className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                                >
                                    Política de Privacidad
                                </Link>
                            </label>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="whatsapp"
                                checked={wantsMarketing}
                                onCheckedChange={(checked) => setWantsMarketing(checked === true)}
                                className="mt-0.5"
                            />
                            <label htmlFor="whatsapp" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                Acepto recibir notificaciones de premios y novedades por WhatsApp
                            </label>
                        </div>

                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="security"
                                checked={wantsTransactional}
                                onCheckedChange={(checked) => setWantsTransactional(checked === true)}
                                className="mt-0.5"
                            />
                            <label htmlFor="security" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                                Acepto recibir alertas de seguridad por WhatsApp (inicios de sesión, bloqueos)
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center">
                            {error.includes("sesión de registro expiró") ? (
                                <span>
                                    Tu sesión de registro expiró o es inválida. Por favor,{" "}
                                    <Link
                                        href="/login"
                                        className="underline underline-offset-2 font-medium hover:text-destructive/80 transition-colors"
                                    >
                                        verifica tu número nuevamente desde inicio
                                    </Link>.
                                </span>
                            ) : (
                                <p>{error}</p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || username.length < 3 || !acceptedTerms}
                        className="w-full py-6 text-base rounded-xl"
                    >
                        {isLoading ? "Creando perfil..." : "Crear Perfil"}
                    </Button>
                </form>
            </div >
        </div >
    );
}
