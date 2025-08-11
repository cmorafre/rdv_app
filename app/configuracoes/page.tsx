"use client"

import Link from "next/link"
import { Users, Settings, Shield, Database, Mail, Bell } from "lucide-react"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const configOptions = [
  {
    title: "Usuários",
    description: "Gerenciar usuários do sistema, criar novos usuários e definir permissões",
    icon: Users,
    href: "/configuracoes/usuarios",
    available: true,
  },
  {
    title: "Sistema",
    description: "Configurações gerais do sistema, preferências e parâmetros",
    icon: Settings,
    href: "/configuracoes/sistema",
    available: false,
  },
  {
    title: "Segurança",
    description: "Configurações de segurança, senhas e autenticação",
    icon: Shield,
    href: "/configuracoes/seguranca",
    available: false,
  },
  {
    title: "Backup",
    description: "Backup e restauração de dados do sistema",
    icon: Database,
    href: "/configuracoes/backup",
    available: false,
  },
  {
    title: "E-mail",
    description: "Configurações de envio de e-mail e notificações",
    icon: Mail,
    href: "/configuracoes/email",
    available: false,
  },
  {
    title: "Notificações",
    description: "Gerenciar notificações e alertas do sistema",
    icon: Bell,
    href: "/configuracoes/notificacoes",
    available: false,
  },
]

export default function Configuracoes() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Configurações" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações e preferências do sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configOptions.map((option) => {
            const Icon = option.icon
            return (
              <Card key={option.href} className={!option.available ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {option.title}
                    {!option.available && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Em breve
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {option.available ? (
                    <Button asChild className="w-full">
                      <Link href={option.href}>
                        Acessar
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Em desenvolvimento
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}