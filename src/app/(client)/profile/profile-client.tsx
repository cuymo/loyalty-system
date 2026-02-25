/**
 * (client)/profile/profile-client.tsx
 * Descripcion: Componente cliente del perfil con edicion de avatar y username
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 */

"use client";

import { useState } from "react";
import { updateClientProfile, logoutClient, deleteMyAccount } from "@/actions/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Save, MessageCircle, Trash2, AlertTriangle, FileText, Shield } from "lucide-react";
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
}

export function ProfileClient({ client, avatars }: ProfileClientProps) {
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
                    <div className="grid grid-cols-5 gap-3 p-4 bg-accent/30 border border-border/40 rounded-2xl animate-in zoom-in-95 duration-300 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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
                                    <p className="text-[11px] text-muted-foreground leading-tight">Campañas, novedades y días de puntos.</p>
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

                    <Link
                        href="/terms"
                        className="bg-accent/10 border-2 border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors group mt-4"
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
                        className="bg-accent/10 border-2 border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors group mt-4"
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

                {message && (
                    <p
                        className={`text-sm text-center font-medium animate-in slide-in-from-bottom-2 ${message.includes("Error") ? "text-destructive" : "text-success"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full py-6 rounded-2xl flex items-center justify-center gap-2 font-semibold shadow-sm hover:shadow-md transition-all"
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
                    className="w-full flex items-center justify-center gap-2 py-6 rounded-2xl font-semibold shadow-sm hover:shadow-md transition-all opacity-90 hover:opacity-100"
                >
                    <LogOut size={16} />
                    Cerrar Sesion
                </Button>
            </div>

            {/* Eliminar Cuenta */}
            <div className="pb-6 md:pb-0 animate-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both">
                <button
                    onClick={() => openModal("deleteAccount")}
                    className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-2 underline underline-offset-4"
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
                            <p className="text-sm text-destructive font-semibold">Se perderán permanentemente:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Todos tus <span className="font-semibold text-foreground">{client.points} puntos</span></li>
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
