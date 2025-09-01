"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Car,
  Settings2,
  Plus,
  List,
  Tag,
  Users,
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

// Função para gerar a navegação com base na rota atual
const getRdvNavigation = (pathname: string) => {
  // Função para verificar se um item deve estar ativo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isItemActive = (item: any) => {
    if (!item.items) {
      return pathname === item.url
    }
    
    // Para itens com sub-itens, verifica se algum sub-item está ativo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return item.items.some((subItem: any) => {
      // Verifica match exato ou se a rota atual está dentro da seção
      return pathname === subItem.url || pathname.startsWith(item.url + "/")
    }) || pathname.startsWith(item.url + "/")
  }

  return {
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
        isActive: pathname === "/",
      },
      {
        title: "Relatórios",
        url: "/relatorios",
        icon: FileText,
        isActive: isItemActive({
          url: "/relatorios",
          items: [
            { url: "/relatorios/novo" },
            { url: "/relatorios/todos" }
          ]
        }),
        items: [
          {
            title: "Novo Relatório",
            url: "/relatorios/novo",
            icon: Plus,
            isActive: pathname === "/relatorios/novo",
          },
          {
            title: "Todos os Relatórios",
            url: "/relatorios/todos",
            icon: List,
            isActive: pathname === "/relatorios/todos" || pathname.startsWith("/relatorios/") && pathname !== "/relatorios/novo",
          },
        ],
      },
      {
        title: "Despesas",
        url: "/despesas",
        icon: Receipt,
        isActive: isItemActive({
          url: "/despesas",
          items: [
            { url: "/despesas/nova" },
            { url: "/despesas/todas" }
          ]
        }),
        items: [
          {
            title: "Nova Despesa",
            url: "/despesas/nova",
            icon: Plus,
            isActive: pathname === "/despesas/nova",
          },
          {
            title: "Todas as Despesas",
            url: "/despesas/todas",
            icon: List,
            isActive: pathname === "/despesas/todas" || (pathname.startsWith("/despesas/") && pathname !== "/despesas/nova"),
          },
        ],
      },
      {
        title: "Categorias",
        url: "/categorias",
        icon: Tag,
        isActive: isItemActive({
          url: "/categorias",
          items: [
            { url: "/categorias/nova" },
            { url: "/categorias/todas" }
          ]
        }),
        items: [
          {
            title: "Nova Categoria",
            url: "/categorias/nova",
            icon: Plus,
            isActive: pathname === "/categorias/nova",
          },
          {
            title: "Todas as Categorias",
            url: "/categorias/todas",
            icon: List,
            isActive: pathname === "/categorias/todas" || (pathname.startsWith("/categorias/") && pathname !== "/categorias/nova"),
          },
        ],
      },
      {
        title: "Veículos",
        url: "/veiculos",
        icon: Car,
        isActive: isItemActive({
          url: "/veiculos",
          items: [
            { url: "/veiculos/novo" },
            { url: "/veiculos/todos" }
          ]
        }),
        items: [
          {
            title: "Novo Veículo",
            url: "/veiculos/novo",
            icon: Plus,
            isActive: pathname === "/veiculos/novo",
          },
          {
            title: "Todos os Veículos",
            url: "/veiculos/todos",
            icon: List,
            isActive: pathname === "/veiculos/todos" || (pathname.startsWith("/veiculos/") && pathname !== "/veiculos/novo"),
          },
        ],
      },
      {
        title: "Configurações",
        url: "/configuracoes",
        icon: Settings2,
        isActive: isItemActive({
          url: "/configuracoes",
          items: [
            { url: "/configuracoes/usuarios" }
          ]
        }),
        items: [
          {
            title: "Usuários",
            url: "/configuracoes/usuarios",
            icon: Users,
            isActive: pathname === "/configuracoes/usuarios" || pathname.startsWith("/configuracoes/usuarios/"),
          },
        ],
      },
    ],
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Gerar navegação baseada na rota atual
  const navigation = getRdvNavigation(pathname)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
