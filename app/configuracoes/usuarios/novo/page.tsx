"use client"

import { NovoUsuarioForm } from "@/components/forms/novo-usuario-form"
import { AppLayout } from "@/components/layouts/app-layout"

export default function NovoUsuarioPage() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Configurações", href: "/configuracoes" },
    { label: "Usuários", href: "/configuracoes/usuarios" },
    { label: "Novo Usuário" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <NovoUsuarioForm />
    </AppLayout>
  )
}