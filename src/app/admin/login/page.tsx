/**
 * admin/login/page.tsx
 * Descripcion: Pagina de login para administradores de Crew Zingy
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { signIn, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl border border-border">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-foreground">Crew Zingy</h1>
                        <p className="text-muted-foreground text-sm">Panel de Administracion</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                                Correo Electronico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="admin@crewzingy.com"
                                className="w-full px-4 py-3 bg-accent text-accent-foreground border border-border rounded-lg text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                                Contrasena
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                placeholder="********"
                                className="w-full px-4 py-3 bg-accent text-accent-foreground border border-border rounded-lg text-foreground placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent disabled:opacity-50 transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-destructive text-sm text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-6 text-lg"
                        >
                            {isLoading ? "Ingresando..." : "Ingresar"}
                        </Button>
                    </form>
                </div>
            </div>
        </SessionProvider>
    );
}
