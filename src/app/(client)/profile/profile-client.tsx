/**
 * (client)/profile/profile-client.tsx
 * Descripcion: Componente cliente del perfil con edicion de avatar y username
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { updateClientProfile, logoutClient, deleteMyAccount, applyReferralCode } from "@/actions/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Save, MessageCircle, Trash2, AlertTriangle, FileText, Shield, Users, Copy, Check, Share2, Lock } from "lucide-react";
import type { Client } from "@/types";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { useModalStore } from "@/lib/modal-store";

interface ProfileClientProps {
    client: Client & {
        changesRemaining?: number;
        vip?: {
            currentTier: string;
            nextTierPoints: number;
            nextTierName: string;
            lifetimePoints: number;
        };
    };
    avatars: string[];
    referralProgress: {
        enabled: boolean;
        usedThisMonth: number;
        limit: number;
        currentReward: number;
        allCompleted: boolean;
        shareMessage: string;
    };
}

export function ProfileClient({ client, avatars, referralProgress }: ProfileClientProps) {
    const router = useRouter();
    const { openModal, closeModal, isOpen } = useModalStore();
    const [username, setUsername] = useState(client.username);
    const [avatarSvg, setAvatarSvg] = useState(client.avatarSvg);
    const [wantsMarketing, setWantsMarketing] = useState(client.wantsMarketing ?? true);
    const [wantsTransactional, setWantsTransactional] = useState(client.wantsTransactional ?? true);
    const [showAvatars, setShowAvatars] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [referralInput, setReferralInput] = useState("");
    const [isReferralLoading, setIsReferralLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        setMessage("");
        try {
            const result = await updateClientProfile({
                username,
                avatarSvg,
                wantsMarketing,
                wantsTransactional
            });
            if (result.success) {
                setMessage("Perfil actualizado");
                router.refresh();
            } else {
                setMessage(result.error || "Error al actualizar");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyReferral = async () => {
        if (!referralInput) return;
        setIsReferralLoading(true);
        setMessage("");
        try {
            const result = await applyReferralCode(referralInput);
            if (result.success) {
                setMessage("¡Código aplicado con éxito! 🎉");
                setReferralInput("");
                router.refresh();
            } else {
                setMessage(result.error || "Código inválido");
            }
        } finally {
            setIsReferralLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutClient();
        router.push("/login");
        router.refresh();
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteMyAccount();
            if (result.success) {
                closeModal();
                router.push("/login");
                router.refresh();
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 space-y-6 animate-in fade-in duration-500">
            {/* Profile Card */}
            <div className="bg-card border border-border/50 shadow-sm rounded-3xl p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="relative group">
                        <button
                            onClick={() => setShowAvatars(!showAvatars)}
                            className="w-24 h-24 rounded-full flex items-center justify-center hover:opacity-80 hover:shadow-md transition-all overflow-hidden duration-300 active:scale-95"
                        >
                            <Image
                                src={`/avatars/${avatarSvg}`}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className="object-cover w-full h-full rounded-full"
                            />
                        </button>
                    </div>
                    <p className="text-muted-foreground text-xs font-medium">Toca para cambiar</p>
                </div>

                {/* Avatar Grid */}
                {showAvatars && avatars.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 p-4 bg-accent/30 border border-border/40 rounded-2xl animate-in zoom-in-95 duration-300 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        {avatars.map((avatar) => (
                            <button
                                key={avatar}
                                onClick={() => {
                                    setAvatarSvg(avatar);
                                    setShowAvatars(false);
                                }}
                                className={`w-12 h-12 rounded-full transition-all flex items-center justify-center overflow-hidden active:scale-90 ${avatarSvg === avatar
                                    ? "ring-4 ring-primary shadow-sm"
                                    : "hover:opacity-80 hover:scale-105"
                                    }`}
                            >
                                <Image
                                    src={`/avatars/${avatar}`}
                                    alt={avatar.replace(".svg", "").replace(/-/g, " ")}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full rounded-full"
                                />
                            </button>
                        ))}
                    </div>
                )}



                {/* Username */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Nombre de Usuario</label>
                    <input
                        value={username}
                        disabled={client.changesRemaining === 0}
                        onChange={(e) =>
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                        }
                        className="w-full px-4 py-3.5 bg-accent/10 focus:bg-background border-2 border-border/50 rounded-2xl text-foreground font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground px-1 font-medium mt-1">
                        Te quedan {client.changesRemaining ?? 2} cambios de nombre por año.
                    </p>
                </div>

                {/* Phone (readonly) */}
                <div className="space-y-2 pb-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Telefono</label>
                    <input
                        value={client.phone}
                        disabled
                        className="w-full px-4 py-3.5 bg-accent/30 border border-border/30 rounded-2xl text-muted-foreground font-mono cursor-not-allowed shadow-none"
                    />
                </div>

                {/* Programa de Referidos */}
                <div className="space-y-4 pt-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Programa de Referidos</label>
                    <div className="relative">
                        {/* Overlay Locked State */}
                        {!referralProgress.enabled && (
                            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center border border-border overflow-hidden">
                                <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground shadow-sm">
                                    <Lock size={24} />
                                </div>
                                <p className="text-sm font-bold text-foreground mb-1">Temporalmente Inhabilitado</p>
                                <p className="text-[11px] text-muted-foreground max-w-[200px]">Te notificaremos apenas el programa vuelva a estar activo.</p>
                            </div>
                        )}

                        <div className={`bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-4 shadow-sm relative z-10 ${!referralProgress.enabled ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                                        <Users size={20} />
                                    </div>
                                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                                        <span className="text-sm font-bold text-foreground block truncate">
                                            Tu Código: #{client.id.toString().padStart(6, '0')}
                                        </span>
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            {referralProgress.allCompleted
                                                ? "¡Has completado todas las metas! 🎉"
                                                : `Invita ${referralProgress.limit - referralProgress.usedThisMonth} amigo(s) más para ganar ${referralProgress.currentReward} pts.`
                                            }
                                        </p>
                                        {!referralProgress.allCompleted && (
                                            <>
                                                <div className="mt-2 w-full bg-border rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, (referralProgress.usedThisMonth / referralProgress.limit) * 100)}%` }} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1 text-right w-full">Progreso: {referralProgress.usedThisMonth}/{referralProgress.limit}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const paddedId = client.id.toString().padStart(6, '0');
                                        const referLink = `${window.location.origin}/register?ref=${paddedId}`;
                                        const rawMessage = referralProgress.shareMessage
                                            .replace("{{link}}", referLink)
                                            .replace("{{username}}", client.username);

                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'Únete a Crew Zingy',
                                                text: rawMessage,
                                            }).catch(console.error);
                                        } else {
                                            navigator.clipboard.writeText(rawMessage);
                                            const prevMsg = message;
                                            setMessage("¡Mensaje y link copiados al portapapeles!");
                                            setTimeout(() => setMessage(prevMsg), 2000);
                                        }
                                    }}
                                    className="h-9 sm:h-8 rounded-lg px-4 sm:px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-all font-bold w-full sm:w-auto shrink-0"
                                >
                                    <Share2 size={14} />
                                    Compartir
                                </Button>
                            </div>

                            {/* Canjear código de amigo */}
                            {!client.referredBy && (
                                <div className="pt-2 border-t border-primary/10 space-y-3">
                                    <p className="text-[11px] text-muted-foreground font-medium">¿Te invitó un amigo? Ingresa su código aquí:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ej: 123"
                                            value={referralInput}
                                            onChange={(e) => setReferralInput(e.target.value.replace(/\D/g, ""))}
                                            className="flex-1 min-w-0 px-3 py-2 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                        />
                                        <Button
                                            size="sm"
                                            disabled={!referralInput || isReferralLoading}
                                            onClick={handleApplyReferral}
                                            className="rounded-xl px-4 font-bold shadow-sm shrink-0 h-10 sm:h-9"
                                        >
                                            {isReferralLoading ? "..." : "Canjear"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {client.referredBy && (
                                <div className="flex items-center gap-2 pt-1 border-t border-primary/5">
                                    <div className="p-1 bg-success/10 text-success rounded-full">
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[11px] text-success font-bold uppercase tracking-wider">¡Código de referido aplicado!</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preferencias de Notificacion */}
                <div className="space-y-4 pt-2 pb-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Preferencias de Notificación</label>

                    <div className="bg-accent/10 border-2 border-border/50 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
                        {/* Transactional Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                    <Shield size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-foreground">Cuenta y Seguridad</span>
                                    <p className="text-[11px] text-muted-foreground leading-tight">Alertas de canjes, saldo y bloqueos.</p>
                                </div>
                            </div>
                            <label className="flex items-center cursor-pointer">
                                <button
                                    type="button"
                                    onClick={() => setWantsTransactional(!wantsTransactional)}
                                    className={`w-11 h-6 rounded-full transition-all flex items-center relative ${wantsTransactional ? "bg-primary" : "bg-muted"}`}
                                >
                                    <div className={`w-4 h-4 bg-primary-foreground rounded-full transition-transform absolute left-1 ${wantsTransactional ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </label>
                        </div>

                        <div className="w-full h-px bg-border/50" />

                        {/* Marketing Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 text-success rounded-xl">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-foreground">Marketing y Premios</span>
                                    <p className="text-[11px] text-muted-foreground leading-tight">Campaños, novedades y días de puntos.</p>
                                </div>
                            </div>
                            <label className="flex items-center cursor-pointer">
                                <button
                                    type="button"
                                    onClick={() => setWantsMarketing(!wantsMarketing)}
                                    className={`w-11 h-6 rounded-full transition-all flex items-center relative ${wantsMarketing ? "bg-primary" : "bg-muted"}`}
                                >
                                    <div className={`w-4 h-4 bg-primary-foreground rounded-full transition-transform absolute left-1 ${wantsMarketing ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Legal Section */}
                <div className="space-y-4 pt-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Legal</label>
                    <div className="space-y-3">
                        <Link
                            href="/terms"
                            className="bg-accent/10 border-2 border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent text-muted-foreground rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Términos y Condiciones</span>
                                    <p className="text-[11px] text-muted-foreground leading-tight">Políticas del programa</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/privacy"
                            className="bg-accent/10 border-2 border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent text-muted-foreground rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Shield size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Política de Privacidad</span>
                                    <p className="text-[11px] text-muted-foreground leading-tight">Manejo de tus datos</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {message && (
                    <p
                        className={`text-sm text-center font-bold animate-in slide-in-from-bottom-2 ${message.includes("Error") || message.includes("inválido") ? "text-destructive" : "text-success"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-6 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-sm hover:shadow-md transition-all mt-4"
                >
                    <Save size={16} />
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>

            {/* Logout */}
            <div className="pt-2 pb-2 animate-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
                <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-6 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all opacity-90 hover:opacity-100"
                >
                    <LogOut size={16} />
                    Cerrar Sesión
                </Button>
            </div>

            {/* Eliminar Cuenta */}
            <div className="pb-6 md:pb-0 animate-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both text-center">
                <button
                    onClick={() => openModal("deleteAccount")}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors py-2 underline underline-offset-4"
                >
                    Eliminar mi cuenta
                </button>
            </div>

            {/* Drawer de Confirmación de Eliminación */}
            <Drawer open={isOpen("deleteAccount")} onOpenChange={(open) => !open && closeModal()}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="text-xl text-center">Eliminar Cuenta</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-6 pb-4 space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle size={32} className="text-destructive" />
                            </div>
                        </div>
                        <p className="text-center text-foreground font-medium">
                            ¿Estás seguro de que deseas eliminar tu cuenta?
                        </p>
                        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
                            <p className="text-sm text-destructive font-bold">Se perderán permanentemente:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Todos tus <span className="font-bold text-foreground">{client.points} puntos</span></li>
                                <li>• Tu nombre de usuario</li>
                                <li>• Tu historial de canjes</li>
                                <li>• Tus preferencias y configuraciones</li>
                            </ul>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Si vuelves a registrarte con el mismo número, comenzarás desde cero.
                        </p>
                    </div>
                    <DrawerFooter>
                        <div className="flex gap-3 w-full">
                            <DrawerClose asChild>
                                <Button variant="outline" className="flex-1 py-6 rounded-xl text-muted-foreground">
                                    Cancelar
                                </Button>
                            </DrawerClose>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 py-6 rounded-xl flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

