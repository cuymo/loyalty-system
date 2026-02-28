/**
ID: ui_0001
Componente de barra lateral principal para la navegación administrativa, incluyendo perfiles y enlaces rápidos.
*/
"use client"

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
  Crown,
  Share2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const navMain = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Clientes", url: "/admin/clients", icon: Users },
  { title: "Campañas", url: "/admin/campaigns", icon: Megaphone },
  { title: "Referidos", url: "/admin/referrals", icon: Share2 },
  { title: "Premios", url: "/admin/rewards", icon: Gift },
  { title: "Códigos", url: "/admin/codes", icon: QrCode },
  { title: "Reportes", url: "/admin/reports", icon: BarChart3 },
  { title: "Niveles", url: "/admin/tiers", icon: Crown },
]

const navConfig = [
  { title: "Integraciones", url: "/admin/integrations", icon: Plug },
  { title: "Auditoría", url: "/admin/audit", icon: ClipboardList },
  { title: "Ajustes", url: "/admin/settings", icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xs font-bold">CZ</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-base">Crew Zingy</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Gestión" items={navMain} />
        <NavSecondary items={navConfig} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
