"use client";

import Image from "next/image";
import { useModalStore } from "@/lib/modal-store";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Pencil } from "lucide-react";

interface AvatarSelectorProps {
    currentAvatar: string;
    avatars: string[];
    onSelectAction: (avatar: string) => void;
    disabled?: boolean;
}

const MODAL_KEY = "avatar-selection";

export function AvatarSelector({ currentAvatar, avatars, onSelectAction, disabled }: AvatarSelectorProps) {
    const { openModal, closeModal, isOpen } = useModalStore();
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const open = isOpen(MODAL_KEY);

    const handleSelect = (avatar: string) => {
        onSelectAction(avatar);
        closeModal();
    };

    const avatarGrid = (
        <div className="h-[60vh] overflow-y-auto px-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 py-4">
                {avatars.map((avatar) => (
                    <button
                        key={avatar}
                        type="button"
                        onClick={() => handleSelect(avatar)}
                        className={`group relative aspect-square rounded-2xl border-2 p-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-card ${currentAvatar === avatar
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                            }`}
                    >
                        <Image
                            src={`/avatars/${avatar}`}
                            alt={avatar}
                            width={80}
                            height={80}
                            className="w-full h-full object-contain drop-shadow-sm"
                        />
                        {currentAvatar === avatar && (
                            <div className="absolute inset-0 bg-primary/2 rounded-2xl flex items-center justify-center" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );

    const trigger = (
        <div className="flex flex-col items-center gap-4 group">
            <div className="relative w-28 h-28 rounded-full border-4 border-border overflow-hidden bg-card shadow-xl transition-all group-hover:border-primary/50">
                <Image
                    src={`/avatars/${currentAvatar}`}
                    alt="Avatar seleccionado"
                    fill
                    className="object-contain p-2"
                />
                <button
                    type="button"
                    onClick={() => openModal(MODAL_KEY)}
                    disabled={disabled}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                    <Pencil size={24} />
                </button>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openModal(MODAL_KEY)}
                disabled={disabled}
                className="rounded-full px-6 shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
                Cambiar Personaje
            </Button>
        </div>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={(val) => !val && closeModal()}>
                {trigger}
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Elige tu Personaje</DialogTitle>
                    </DialogHeader>
                    {avatarGrid}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={(val) => !val && closeModal()}>
            {trigger}
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Elige tu Personaje</DrawerTitle>
                </DrawerHeader>
                {avatarGrid}
                <div className="p-4 border-t">
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full">Cerrar</Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
