/**
ID: page_0005
Interfaz de inicio de sesión para clientes utilizando nombre de usuario y contraseña con persistencia mediante JWT.
*/

"use client";

import { useState, useEffect, Suspense } from "react";
import { loginClient, getPublicSettings } from "@/actions/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AlertCircle } from "lucide-react";

function ClientLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notice, setNotice] = useState("");

    useEffect(() => {
        getPublicSettings().then(s => setNotice(s.notice_guest || ""));

        const blockedMsg = searchParams?.get("blocked");
        if (blockedMsg) {
            setError(blockedMsg === "1" ? "Tu cuenta ha sido bloqueada por un administrador." : blockedMsg);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Completa todos los campos");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const result = await loginClient(username, password);
            if (!result.success) {
                setError(result.error || "Error al iniciar sesión");
                return;
            }
            router.push("/client/home");
            router.refresh();
        } catch {
            setError("Error al iniciar sesión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm flex flex-col gap-6">
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
                    <Alert>
                        <AlertDescription className="text-center text-sm whitespace-pre-wrap leading-relaxed">
                            {notice}
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Iniciar Sesión</CardTitle>
                        <CardDescription>
                            Ingresa tu usuario y contraseña para continuar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <FieldGroup>
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle size={16} />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Field>
                                    <FieldLabel htmlFor="username">Usuario</FieldLabel>
                                    <Input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                                            if (error) setError("");
                                        }}
                                        placeholder="mi_usuario"
                                        disabled={isLoading}
                                        className="font-mono"
                                        autoComplete="username"
                                        required
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (error) setError("");
                                        }}
                                        placeholder="••••••"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                        required
                                    />
                                </Field>

                                <Field>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !username || !password}
                                    >
                                        {isLoading ? "Ingresando..." : "Ingresar"}
                                    </Button>
                                    <FieldDescription className="text-center">
                                        ¿No tienes cuenta?{" "}
                                        <Link href="/register">Regístrate</Link>
                                    </FieldDescription>
                                </Field>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ClientLoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-svh items-center justify-center"><p className="text-muted-foreground animate-pulse">Cargando...</p></div>}>
            <ClientLoginContent />
        </Suspense>
    );
}
