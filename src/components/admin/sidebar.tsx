/**
 * components/admin/sidebar.tsx
 * Descripcion: Sidebar de navegacion del panel de administracion (responsive)
 * Fecha de creacion: 2026-02-21
 * Autor: Crew Zingy Dev
 * Fecha de modificacion: 2026-02-22
 * Descripcion de la modificacion: Sidebar responsive con Sheet drawer en movil
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Gift,
    Megaphone,
    QrCode,
    BarChart3,
    Settings,
    Plug,
    ClipboardList,
    LogOut,
    Menu,
    Bell,
    UserCircle,
    ExternalLink,
    Crown,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ModeToggle } from "../shared/mode-toggle";
import { getAdminNotifications, markAdminNotificationsAsRead, getSettings } from "@/actions/admin";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { clickSoftSound } from "@/lib/click-soft";

type NavGroup = {
    label: string;
    items: { label: string; href: string; icon: any }[];
};

const navGroups: NavGroup[] = [
    {
        label: "Principal",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        ],
    },
    {
        label: "Gestión",
        items: [
            { label: "Clientes", href: "/admin/clients", icon: Users },
            { label: "Campañas", href: "/admin/campaigns", icon: Megaphone },
            { label: "Premios", href: "/admin/rewards", icon: Gift },
            { label: "Códigos", href: "/admin/codes", icon: QrCode },
            { label: "Reportes", href: "/admin/reports", icon: BarChart3 },
            { label: "Niveles", href: "/admin/tiers", icon: Crown },
        ],
    },
    {
        label: "Configuración",
        items: [
            { label: "Integraciones", href: "/admin/integrations", icon: Plug },
            { label: "Log de Auditoría", href: "/admin/audit", icon: ClipboardList },
            { label: "Ajustes del Sistema", href: "/admin/settings", icon: Settings },
        ],
    }
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                    Crew Zingy
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Panel de Administración</p>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                        <h4 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {group.label}
                        </h4>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive =
                                    item.href === "/admin"
                                        ? pathname === "/admin"
                                        : pathname.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? "bg-card text-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent text-accent-foreground/60"
                                            }`}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout & Profile */}
            <div className="p-4 border-t border-border space-y-2">
                {/* User Section (Clickable Profile) */}
                <Link
                    href="/admin/profile"
                    onClick={onNavigate}
                    className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-card border border-border hover:border-border transition-colors"
                >
                    <UserCircle size={32} className="text-muted-foreground" />
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-foreground truncate">
                            {session?.user?.name || "Administrador"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                            {session?.user?.email || "Cargando..."}
                        </span>
                    </div>
                </Link>

                <Button
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="w-full justify-start gap-2 px-3 py-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut size={16} />
                    Cerrar Sesión
                </Button>
            </div>
        </>
    );
}

export type AppNotification = {
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    isRead?: boolean;
};

export function AdminSidebar() {
    const isMobile = useIsMobile();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Store preferences in a ref to always read latest without re-running useEffect
    const alertPrefsRef = useRef<Record<string, { toast: boolean; sound: boolean }>>({});

    const [playClick] = useSound(clickSoftSound, { volume: 0.5 });

    useEffect(() => {
        // Cargar preferencias globales de alertas del administrador
        getSettings().then((settings) => {
            const prefsStr = settings.find(s => s.key === "admin_alert_preferences")?.value;
            if (prefsStr && prefsStr.trim() !== "") {
                try {
                    alertPrefsRef.current = JSON.parse(prefsStr);
                } catch (e) {
                    console.error("Error parsing admin alert preferences", e);
                }
            }
        });

        // Cargar historial de notificaciones persistente
        getAdminNotifications().then((data) => {
            const mapped = data.map(d => ({
                id: d.id.toString(),
                type: d.type,
                message: d.message,
                timestamp: new Date(d.createdAt),
                isRead: d.isRead
            }));
            setNotifications(mapped);
            setHasUnread(mapped.some(n => !n.isRead));
        });

        const eventSource = new EventSource("/api/admin/sse");

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Get configured preferences for this specific event type
                const prefs = alertPrefsRef.current[data.type];

                if (prefs) {
                    // Smart Toasts
                    if (prefs.toast) {
                        if (data.type.includes("delet") || data.type.includes("reject") || data.danger || data.type === "admin_danger_zone") {
                            toast.error(data.message, { duration: 5000 });
                        } else if (data.type.includes("client") || data.type.includes("register") || data.type.includes("approve")) {
                            toast.success(data.message, { duration: 5000 });
                        } else {
                            toast.info(data.message, { duration: 5000 });
                        }
                    }

                    // Smart Sounds
                    if (prefs.sound) {
                        playClick();
                    }
                } else {
                    // Legacy fallback for old events that aren't mapped
                    if (data.type === "new_client" || data.type === "client_registered") {
                        toast.success(data.message, { duration: 5000 });
                        playClick();
                    } else if (data.type === "points_added") {
                        toast.info(data.message, { duration: 5000 });
                    } else if (data.type === "new_redemption" || data.type === "reward_redemption") {
                        toast.warning(data.message, { duration: 10000 });
                        playClick();
                    }
                }

                const newNotif: AppNotification = {
                    id: Date.now().toString(),
                    type: data.type,
                    message: data.message,
                    timestamp: new Date(),
                    isRead: false
                };

                setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep last 20
                setHasUnread(true);
                router.refresh(); // Update dashboard metrics automatically
            } catch (error) {
                console.error("SSE Error:", error);
            }
        };

        return () => eventSource.close();
    }, [router]);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && hasUnread) {
            // Quitamos el punto rojo visual de inmediato para que la animación fluya
            setHasUnread(false);

            // Retrasamos el marcado profundo de lectura (estado y base de datos)
            // para que no cause un re-render que aborte la animación de apertura del Popover
            setTimeout(async () => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                try {
                    await markAdminNotificationsAsRead();
                } catch (error) {
                    console.error("Error marcando notificaciones como leídas", error);
                }
            }, 1000);
        }
    };

    const notificationsPopoverContent = (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 border border-border bg-card text-foreground hover:bg-accent transition-colors relative" aria-label="Notificaciones">
                    <Bell size={20} />
                    {hasUnread && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-sm shadow-destructive/50"></span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-background border-border" align="end" sideOffset={16}>
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notificaciones</h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <Bell size={32} className="mx-auto mb-3 opacity-20" />
                            No hay notificaciones nuevas
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.slice(0, 5).map(n => (
                                <div key={n.id} className="p-4 border-b border-border/50 hover:bg-card/50 transition-colors last:border-0 relative">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5">
                                            {n.type === "new_redemption" ? (
                                                <div className="w-2 h-2 rounded-full bg-warning mt-1" />
                                            ) : n.type === "new_client" ? (
                                                <div className="w-2 h-2 rounded-full bg-success mt-1" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-info mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-muted-foreground leading-snug break-words">{n.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1.5">
                                                {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-border text-center">
                        <Link href="/admin/notifications" className="text-sm text-primary hover:underline font-medium">
                            Ver historial completo
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );

    // Mobile: hamburger + Sheet drawer
    if (isMobile) {
        return (
            <>
                <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b border-border">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(true)}
                            className="text-muted-foreground"
                            aria-label="Abrir menú"
                        >
                            <Menu size={20} />
                        </Button>
                        <span className="text-sm font-bold text-foreground tracking-tight">
                            Crew Zingy
                        </span>
                    </div>
                    {/* Mobile Notification Bell & Theme Toggle */}
                    <div className="mr-2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 border border-border bg-card text-foreground hover:bg-accent transition-colors" asChild title="Ir a vista de cliente">
                            <Link href="/">
                                <ExternalLink size={20} />
                            </Link>
                        </Button>
                        {notificationsPopoverContent}
                        <ModeToggle />
                    </div>
                </div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetContent
                        side="left"
                        showCloseButton={true}
                        className="dark text-foreground w-64 p-0 bg-background border-border flex flex-col"
                    >
                        <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                        <SidebarContent onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </>
        );
    }

    // Desktop: fixed sidebar + desktop header
    return (
        <>
            <aside className="dark text-foreground fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex flex-col z-40">
                <SidebarContent />
            </aside>
            {/* Desktop Header */}
            <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 bg-background/80 backdrop-blur-md border-b border-border items-center justify-end px-6 z-30 gap-4">
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 border border-border bg-card text-foreground hover:bg-accent transition-colors" asChild title="Ir a vista de cliente">
                    <Link href="/">
                        <ExternalLink size={20} />
                    </Link>
                </Button>
                {notificationsPopoverContent}
                <ModeToggle />
            </header>
        </>
    );
}
