import { AppLayout } from "@/components/layouts/app-layout"

export default function Veiculos() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Veículos" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <h1 className="text-2xl font-bold">Gestão de Veículos</h1>
      <div className="bg-muted/50 flex-1 rounded-xl p-4">
        <p>Gestão de veículos será implementada aqui.</p>
      </div>
    </AppLayout>
  )
}