import { AppLayout } from "@/components/layouts/app-layout"
import { NovoVeiculoForm } from "@/components/forms/novo-veiculo-form"

export default function NovoVeiculo() {
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Veículos", href: "/veiculos" },
    { label: "Novo Veículo" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Novo Veículo</h1>
      </div>
      <div className="bg-muted/50 flex-1 rounded-xl p-6">
        <NovoVeiculoForm />
      </div>
    </AppLayout>
  )
}