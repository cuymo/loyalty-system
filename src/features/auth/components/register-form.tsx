/**
 * (auth)/register/register-form.tsx
 * Descripcion: Registro multi-paso (Cuenta → Perfil → Permisos)
 * Usa: shadcn Card + Field/FieldGroup + stepper visual
 */

"use client";

import { useState, useEffect } from "react";
import { registerClient, getAvailableAvatars, checkFieldAvailability } from "@/actions/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AvatarSelector } from "./avatar-selector";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STEPS = [
    { title: "Cuenta", description: "Configura tus credenciales de acceso" },
    { title: "Perfil", description: "Personaliza tu experiencia" },
    { title: "Permisos", description: "Configura tus preferencias" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2">
            {Array.from({ length: total }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${i < current
                            ? "bg-primary text-primary-foreground"
                            : i === current
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                                : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {i < current ? <Check size={14} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div
                            className={`w-8 h-0.5 transition-colors ${i < current ? "bg-primary" : "bg-muted"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export function RegisterForm() {
    const router = useRouter();
    const [step, setStep] = useState(0);

    // Step 1: Cuenta
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Step 2: Perfil
    const [phone, setPhone] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [referredByCode, setReferredByCode] = useState("");
    const [avatarSvg, setAvatarSvg] = useState("default.svg");
    const [avatars, setAvatars] = useState<string[]>([]);

    // Step 3: Permisos
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [wantsMarketing, setWantsMarketing] = useState(true);
    const [wantsTransactional, setWantsTransactional] = useState(false);

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        getAvailableAvatars().then(setAvatars);
    }, []);

    const validateStep = async (s: number): Promise<boolean> => {
        setError("");
        if (s === 0) {
            if (username.length < 3) {
                setError("El usuario debe tener al menos 3 caracteres");
                return false;
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError("El correo electrónico no es válido");
                return false;
            }

            if (phone.length !== 10) {
                setError("El número de teléfono debe tener 10 dígitos");
                return false;
            }

            if (password.length < 6) {
                setError("La contraseña debe tener al menos 6 caracteres");
                return false;
            }
            if (password !== confirmPassword) {
                setError("Las contraseñas no coinciden");
                return false;
            }

            // Validar disponibilidad en el backend
            setIsLoading(true);
            const userCheck = await checkFieldAvailability("username", username);
            if (!userCheck.available) {
                setError(userCheck.message || "Nombre de usuario no disponible");
                setIsLoading(false);
                return false;
            }

            const emailCheck = await checkFieldAvailability("email", email);
            if (!emailCheck.available) {
                setError(emailCheck.message || "Correo ya registrado");
                setIsLoading(false);
                return false;
            }

            const phoneCheck = await checkFieldAvailability("phone", phone);
            if (!phoneCheck.available) {
                if (!phoneCheck.isDeleted) {
                    setError(phoneCheck.message || "Este teléfono ya está en uso");
                    setIsLoading(false);
                    return false;
                }
            }
            setIsLoading(false);
        }

        if (s === 1) {
            if (!birthDate) {
                setError("La fecha de nacimiento es obligatoria");
                return false;
            }
        }

        if (s === 2) {
            if (!acceptedTerms) {
                setError("Debes aceptar los Términos y la Política de Privacidad");
                return false;
            }
        }
        return true;
    };

    const handleNext = async () => {
        const isValid = await validateStep(step);
        if (!isValid) return;
        setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setError("");
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        const isValid = await validateStep(2);
        if (!isValid) return;

        setIsLoading(true);
        setError("");

        try {
            const result = await registerClient({
                phone,
                email,
                username,
                password,
                avatarSvg,
                birthDate,
                referredByCode: referredByCode ? parseInt(referredByCode) : undefined,
                wantsMarketing,
                wantsTransactional,
            });
            if (!result.success) {
                setError(result.error || "Error al registrar");
                return;
            }
            router.push("/client/home");
            router.refresh();
        } catch {
            setError("Error al crear la cuenta");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm flex flex-col gap-6">
                {/* Stepper */}
                <StepIndicator current={step} total={STEPS.length} />

                <Card>
                    <CardHeader>
                        <CardTitle>{STEPS[step].title}</CardTitle>
                        <CardDescription>{STEPS[step].description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* ── Step 1: Cuenta ── */}
                        {step === 0 && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="username">Usuario <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                                        }
                                        placeholder="mi_nombre"
                                        maxLength={50}
                                        className="font-mono"
                                        autoComplete="username"
                                        required
                                        disabled={isLoading}
                                    />
                                    <FieldDescription>
                                        Solo letras, números y guion bajo
                                    </FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="email">Correo Electrónico <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@correo.com"
                                        autoComplete="email"
                                        required
                                        disabled={isLoading}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="phone">Número de Teléfono <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                                        }
                                        placeholder="0912345678"
                                        className="font-mono"
                                        autoComplete="tel"
                                        required
                                        disabled={isLoading}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="password">Contraseña <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        autoComplete="new-password"
                                        required
                                        disabled={isLoading}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="confirm-password">Confirmar Contraseña <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repite tu contraseña"
                                        autoComplete="new-password"
                                        required
                                        disabled={isLoading}
                                    />
                                </Field>
                            </FieldGroup>
                        )}

                        {/* ── Step 2: Perfil ── */}
                        {step === 1 && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel className="text-center mb-6 text-xl font-bold">Elige tu Personaje</FieldLabel>
                                    <div className="flex justify-center py-4">
                                        <AvatarSelector
                                            currentAvatar={avatarSvg}
                                            avatars={avatars}
                                            onSelectAction={setAvatarSvg}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </Field>


                                <Field>
                                    <FieldLabel>Fecha de Nacimiento <span className="text-destructive">*</span></FieldLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left font-normal ${!birthDate ? "text-muted-foreground" : ""}`}
                                                disabled={isLoading}
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
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="referral">Código de Referido (Opcional)</FieldLabel>
                                    <Input
                                        id="referral"
                                        type="text"
                                        value={referredByCode}
                                        onChange={(e) =>
                                            setReferredByCode(e.target.value.replace(/\D/g, ""))
                                        }
                                        placeholder="Ej. 12345"
                                        className="font-mono"
                                        disabled={isLoading}
                                    />
                                </Field>
                            </FieldGroup>
                        )}

                        {/* ── Step 3: Permisos ── */}
                        {step === 2 && (
                            <div className="flex flex-col gap-5">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="terms"
                                        checked={acceptedTerms}
                                        onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                        className="mt-1"
                                        disabled={isLoading}
                                    />
                                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                                        Acepto los <Link href="/terms" className="text-foreground underline">Términos</Link> y la <Link href="/privacy" className="text-foreground underline">Privacidad</Link>
                                    </label>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="whatsapp"
                                        checked={wantsMarketing}
                                        onCheckedChange={(checked) => setWantsMarketing(checked === true)}
                                        className="mt-1"
                                        disabled={isLoading}
                                    />
                                    <label htmlFor="whatsapp" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                                        Recibir notificaciones por WhatsApp
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <Alert variant="destructive" className="mt-6">
                                <AlertCircle size={16} />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 mt-6">
                            {step > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    <ArrowLeft size={16} className="mr-1" />
                                    Atrás
                                </Button>
                            )}

                            {step < STEPS.length - 1 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                                    Siguiente
                                    {!isLoading && <ArrowRight size={16} className="ml-1" />}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading || !acceptedTerms}
                                    className="flex-1"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : "Crear Cuenta"}
                                </Button>
                            )}
                        </div>

                        {/* Link login */}
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            ¿Ya tienes cuenta?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
