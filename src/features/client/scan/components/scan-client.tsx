/**
 * (client)/scan/page.tsx
 * Descripcion: Pagina para ingresar codigos QR manualmente y sumar puntos
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { validateCode, redeemCode } from "@/features/client/scan/actions/client-scan";
import { useRouter } from "next/navigation";
import { QrCode, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";

export function ScanClient() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [codeToConfirm, setCodeToConfirm] = useState<{
        code: string;
        points: number;
    } | null>(null);
    const [result, setResult] = useState<{
        success: boolean;
        pointsAdded?: number;
        error?: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const res = await validateCode(code.trim().toUpperCase());
            if (res.success && res.pointsValue) {
                setCodeToConfirm({
                    code: code.trim().toUpperCase(),
                    points: res.pointsValue,
                });
            } else {
                toast.error(res.error || "Error al validar el código");
                setResult(res);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!codeToConfirm) return;
        setIsLoading(true);
        setResult(null);
        try {
            const res = await redeemCode(codeToConfirm.code);
            setResult(res);
            if (res.success) {
                toast.success(`¡Se agregaron ${res.pointsAdded} puntos a tu cuenta!`);
                setCode("");
                setCodeToConfirm(null);
                router.refresh();
            } else {
                toast.error(res.error || "Error al canjear el código");
                setCodeToConfirm(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sumar Puntos</h1>
                <p className="text-muted-foreground text-sm">
                    Ingresa el codigo de tu tarjeta para sumar puntos
                </p>
            </div>

            {/* Code Input */}
            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                <div className="relative group">
                    <QrCode size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="CZABC123"
                        disabled={isLoading}
                        style={{ textTransform: "uppercase" }}
                        className="w-full pl-14 pr-14 py-5 bg-card/50 backdrop-blur-sm border-2 border-border/50 rounded-2xl text-foreground text-xl font-mono tracking-[0.2em] placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-50 transition-all text-center shadow-sm"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading || !code.trim()}
                    className="w-full py-7 text-base rounded-2xl shadow-sm hover:shadow-md transition-all font-semibold"
                >
                    {isLoading ? "Verificando..." : "Usar Codigo"}
                </Button>
            </form>

            {/* Result */}
            {result && (
                <div
                    className={`p-6 rounded-3xl border-2 text-center space-y-4 animate-in zoom-in-95 duration-500 shadow-sm ${result.success
                        ? "bg-success/5 border-success/20"
                        : "bg-destructive/5 border-destructive/20"
                        }`}
                >
                    <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${result.success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            }`}
                    >
                        {result.success ? (
                            <Check size={32} />
                        ) : (
                            <X size={32} />
                        )}
                    </div>
                    {result.success ? (
                        <div className="space-y-1">
                            <p className="text-success font-semibold tracking-wide uppercase text-sm">Puntos Sumados</p>
                            <p className="text-4xl font-bold text-foreground tracking-tight drop-shadow-sm">
                                +{result.pointsAdded}
                            </p>
                        </div>
                    ) : (
                        <p className="text-destructive font-medium">{result.error}</p>
                    )}
                </div>
            )}

            <p className="text-center text-muted-foreground text-xs">
                El codigo se encuentra en la tarjeta fisica que recibiste
            </p>

            {/* Drawer de Confirmacion (Mobile-first) */}
            <Drawer open={!!codeToConfirm} onOpenChange={(open) => !open && setCodeToConfirm(null)}>
                <DrawerContent>
                    <DrawerHeader>
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                            <QrCode size={32} />
                        </div>
                        <DrawerTitle className="text-xl text-center">Código Validado</DrawerTitle>
                        <p className="text-muted-foreground text-center text-sm">
                            Recibirás <strong className="text-foreground">{codeToConfirm?.points} puntos</strong> en tu cuenta. ¿Confirmas el canje?
                        </p>
                    </DrawerHeader>
                    <DrawerFooter>
                        <div className="flex gap-3 w-full">
                            <DrawerClose asChild>
                                <Button
                                    variant="outline"
                                    disabled={isLoading}
                                    className="flex-1 py-6 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                            </DrawerClose>
                            <Button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="flex-1 py-6 rounded-xl"
                            >
                                Confirmar
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
