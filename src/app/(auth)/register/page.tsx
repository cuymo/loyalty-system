/**
 * (auth)/register/page.tsx
 * Descripcion: Pagina de registro con Suspense wrapper para useSearchParams
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-21
 * Descripcion de la modificacion: Agregado Suspense boundary para compatibilidad con SSG
 */

import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="w-8 h-8 border-4 border-border border-t-white rounded-full animate-spin" />
                </div>
            }
        >
            <RegisterForm />
        </Suspense>
    );
}
