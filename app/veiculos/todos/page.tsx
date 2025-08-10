import { AppLayout } from "@/components/layouts/app-layout"
import { VeiculosList } from "@/components/veiculos/veiculos-list"

export default function TodosVeiculos() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Veículos", href: "/veiculos" },
    { label: "Todos os Veículos" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos os Veículos</h1>
      </div>
      <div className="bg-muted/50 flex-1 rounded-xl p-6">
        <VeiculosList />
      </div>
    </AppLayout>
  )
}