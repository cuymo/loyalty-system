/**
 * (auth)/login/page.tsx
 * Descripcion: Pagina de login con OTP via telefono para clientes
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-23
 * Descripcion: Añadido reenvío OTP con countdown y límite de intentos
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { requestOtp, verifyOtp, getPublicSettings } from "@/actions/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ClientLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "confirm" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const [resendCount, setResendCount] = useState(0);
    const MAX_RESENDS = 3;

    useEffect(() => {
        getPublicSettings().then(s => setNotice(s.notice_guest || ""));
    }, []);

    // Countdown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Formatear teléfono para mostrar: 0999 999 999
    const formatPhone = (p: string) => {
        if (p.length === 10) return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
        return p;
    };

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length !== 10) {
            setError("El numero debe tener 10 digitos");
            return;
        }
        setError("");
        setStep("confirm");
    };

    const handleConfirmAndSend = async () => {
        setIsLoading(true);
        setError("");
        try {
            const result = await requestOtp(phone);
            if (result.success) {
                setStep("otp");
                setResendTimer(result.cooldownRemaining ?? 20);
                setResendCount((prev) => prev + 1);
            } else {
                setError(result.error || "Error al enviar el OTP");
                if (result.cooldownRemaining) {
                    setResendTimer(result.cooldownRemaining);
                }
            }
        } catch {
            setError("Error al enviar el OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = useCallback(async () => {
        if (resendTimer > 0 || resendCount >= MAX_RESENDS) return;
        setIsLoading(true);
        setError("");
        try {
            const result = await requestOtp(phone);
            if (result.success) {
                setResendTimer(result.cooldownRemaining ?? 20);
                setResendCount((prev) => prev + 1);
            } else {
                setError(result.error || "Error al reenviar");
                if (result.cooldownRemaining) {
                    setResendTimer(result.cooldownRemaining);
                }
            }
        } catch {
            setError("Error al reenviar el OTP");
        } finally {
            setIsLoading(false);
        }
    }, [phone, resendTimer, resendCount]);

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const result = await verifyOtp(phone, otp);
            if (!result.success) {
                setError(result.error || "Error al verificar");
                return;
            }
            if (result.isNew) {
                // Nuevo usuario: redirigir a registro
                router.push(`/register?phone=${phone}`);
            } else {
                // Usuario existente: redirigir al home
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("Error al verificar el OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Crew Zingy
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Tu programa de lealtad favorito
                    </p>
                </div>

                {/* Aviso Guest */}
                {notice && (
                    <div className="p-4 bg-card border border-border rounded-xl mb-6">
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed text-center">{notice}</p>
                    </div>
                )}

                {/* Paso 1: Ingresar teléfono */}
                {step === "phone" && (
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Numero de Telefono
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                                }
                                placeholder="0998765432"
                                className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground text-lg tracking-wider placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-center font-mono"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Recibirás un codigo de verificacion via WhatsApp
                            </p>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={phone.length !== 10}
                            className="w-full py-6 text-base rounded-xl"
                        >
                            Continuar
                        </Button>

                        <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                            Al continuar, aceptas nuestros{" "}
                            <Link
                                href="/terms"
                                className="text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                Términos y Condiciones
                            </Link>
                            {" "}y{" "}
                            <Link
                                href="/privacy"
                                className="text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                Política de Privacidad
                            </Link>
                        </p>
                    </form>
                )}

                {/* Paso 2: Confirmar número */}
                {step === "confirm" && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Enviaremos un código de verificación a:
                            </p>
                            <p className="text-2xl font-bold text-foreground text-center tracking-wider font-mono">
                                {formatPhone(phone)}
                            </p>
                            <p className="text-xs text-muted-foreground text-center">
                                Asegúrate de que el número sea correcto antes de continuar
                            </p>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm text-center">{error}</p>
                        )}

                        <div className="space-y-3">
                            <Button
                                onClick={handleConfirmAndSend}
                                disabled={isLoading}
                                className="w-full py-6 text-base rounded-xl"
                            >
                                {isLoading ? "Enviando código..." : "Sí, enviar código"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setStep("phone");
                                    setError("");
                                }}
                                className="w-full text-muted-foreground"
                            >
                                Corregir número
                            </Button>
                        </div>
                    </div>
                )}

                {/* Paso 3: Ingresar OTP */}
                {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Codigo de Verificacion
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                placeholder="000000"
                                disabled={isLoading}
                                autoFocus
                                className="w-full px-4 py-3.5 bg-card border border-border rounded-xl text-foreground text-2xl tracking-[0.5em] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 transition-all text-center font-mono"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                Ingresa el codigo de 6 digitos enviado a {formatPhone(phone)}
                            </p>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            className="w-full py-6 text-base rounded-xl"
                        >
                            {isLoading ? "Verificando..." : "Verificar"}
                        </Button>

                        {/* Reenviar OTP */}
                        <div className="text-center">
                            {resendCount >= MAX_RESENDS ? (
                                <p className="text-xs text-muted-foreground">
                                    Has alcanzado el límite de reenvíos
                                </p>
                            ) : resendTimer > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    Reenviar código en{" "}
                                    <span className="font-mono font-semibold text-foreground">{resendTimer}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw size={12} />
                                    Reenviar código ({MAX_RESENDS - resendCount} restantes)
                                </button>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setStep("phone");
                                setOtp("");
                                setError("");
                                setResendTimer(0);
                                setResendCount(0);
                            }}
                            className="w-full text-muted-foreground"
                        >
                            Cambiar numero
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
