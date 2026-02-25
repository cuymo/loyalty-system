/**
 * app/not-found.tsx
 * Descripcion: Página 404 (No encontrado) global para enlaces rotos
 * Fecha de creacion: 2026-02-24
 * Autor: Crew Zingy Dev
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="relative">
                        <Compass className="w-24 h-24 text-muted-foreground/20 animate-spin-slow" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-black text-foreground">404</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Página no encontrada
                    </h1>
                    <p className="text-muted-foreground">
                        Parece que te has perdido. La página que buscas no existe o ha sido movida.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="rounded-xl">
                        <Link href="/">
                            Volver al inicio
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
