/**
ID: page_0004
Interfaz de autenticación exclusiva para administradores mediante correo electrónico y contraseña (NextAuth).
*/

"use client";

import { useState } from "react";
import { signIn, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Credenciales incorrectas. Intenta de nuevo.");
            } else {
                router.push("/admin");
                router.refresh();
            }
        } catch {
            setError("Error al iniciar sesion. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SessionProvider>
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm flex flex-col gap-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">
                            Crew Zingy
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Panel de Administración
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Iniciar Sesión</CardTitle>
                            <CardDescription>
                                Ingresa tus credenciales de administrador
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
                                        <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            placeholder="admin@crewzingy.com"
                                            autoComplete="email"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                        />
                                    </Field>

                                    <Field>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? "Ingresando..." : "Ingresar"}
                                        </Button>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </SessionProvider>
    );
}
