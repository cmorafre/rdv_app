import { AppLayout } from "@/components/layouts/app-layout"

export default function Configuracoes() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Configurações" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="text-2xl font-bold">Configurações</h1>
      <div className="bg-muted/50 flex-1 rounded-xl p-4">
        <p>Configurações do sistema serão implementadas aqui.</p>
      </div>
    </AppLayout>
  )
}