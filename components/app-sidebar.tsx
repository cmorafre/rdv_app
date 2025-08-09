"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Car,
  Settings2,
  Plus,
  List,
  Plane,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AppHeader } from "@/components/app-header"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"

// Navegação do RDV conforme PRD
const rdvNavigation = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: "Relatórios",
      url: "/relatorios",
      icon: FileText,
      items: [
        {
          title: "Novo Relatório",
          url: "/relatorios/novo",
          icon: Plus,
        },
        {
          title: "Todos os Relatórios",
          url: "/relatorios/todos",
          icon: List,
        },
      ],
    },
    {
      title: "Despesas",
      url: "/despesas",
      icon: Receipt,
      items: [
        {
          title: "Nova Despesa",
          url: "/despesas/nova",
          icon: Plus,
        },
        {
          title: "Todas as Despesas",
          url: "/despesas/todas",
          icon: List,
        },
      ],
    },
    {
      title: "Veículos",
      url: "/veiculos",
      icon: Car,
    },
    {
      title: "Configurações",
      url: "/configuracoes",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={rdvNavigation.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
