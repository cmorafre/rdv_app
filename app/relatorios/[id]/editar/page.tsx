"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const RelatorioEditSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  destino: z.string().optional(),
  proposito: z.string().optional(),
  status: z.enum(["em_andamento", "reembolsado"]),
  cliente: z.string().optional(),
  observacoes: z.string().optional(),
}).refine((data) => {
  if (data.dataInicio && data.dataFim) {
    return new Date(data.dataFim) >= new Date(data.dataInicio)
  }
  return true
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["dataFim"],
})

type RelatorioEditFormValues = z.infer<typeof RelatorioEditSchema>

interface Relatorio {
  id: number
  titulo: string
  dataInicio: string
  dataFim: string
  destino?: string
  proposito?: string
  status: string
  cliente?: string
  observacoes?: string
}

export default function EditarRelatorio() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)

  const id = params.id as string

  const form = useForm<RelatorioEditFormValues>({
    resolver: zodResolver(RelatorioEditSchema),
    defaultValues: {
      titulo: "",
      dataInicio: "",
      dataFim: "",
      destino: "",
      proposito: "",
      status: "em_andamento",
      cliente: "",
      observacoes: "",
    },
  })

  useEffect(() => {
    loadRelatorio()
  }, [id])

  const loadRelatorio = async () => {
    try {
      const response = await fetch(`/api/relatorios/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Relatório não encontrado")
          router.push("/relatorios/todos")
          return
        }
        throw new Error("Erro ao carregar relatório")
      }

      const data: Relatorio = await response.json()
      setRelatorio(data)

      // Formatar datas para o input date
      const formatDateForInput = (dateStr: string) => {
        return new Date(dateStr).toISOString().split('T')[0]
      }

      // Preencher o formulário com os dados
      form.reset({
        titulo: data.titulo,
        dataInicio: formatDateForInput(data.dataInicio),
        dataFim: formatDateForInput(data.dataFim),
        destino: data.destino || "",
        proposito: data.proposito || "",
        status: data.status as "em_andamento" | "reembolsado",
        cliente: data.cliente || "",
        observacoes: data.observacoes || "",
      })
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
      toast.error("Erro ao carregar relatório")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: RelatorioEditFormValues) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/relatorios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar relatório")
        return
      }

      toast.success("Relatório atualizado com sucesso!")
      router.push(`/relatorios/${id}`)
    } catch (error) {
      console.error("Erro ao atualizar relatório:", error)
      toast.error("Erro ao atualizar relatório. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todos os Relatórios", href: "/relatorios/todos" },
        { label: "Carregando..." }
      ]}>
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-96 bg-muted/50 rounded-md animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  if (!relatorio) {
    return (
      <AppLayout breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Todos os Relatórios", href: "/relatorios/todos" },
        { label: "Relatório não encontrado" }
      ]}>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Relatório não encontrado</h1>
          <Link href="/relatorios/todos">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Todos os Relatórios", href: "/relatorios/todos" },
    { label: relatorio.titulo, href: `/relatorios/${relatorio.id}` },
    { label: "Editar" }
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Editar Relatório</h1>
            <p className="text-muted-foreground">
              Atualize as informações do relatório
            </p>
          </div>
          <Link href={`/relatorios/${relatorio.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Relatório</CardTitle>
            <CardDescription>
              Preencha os dados básicos do relatório de despesas de viagem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Viagem São Paulo - Janeiro 2024" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Título descritivo para identificar o relatório
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataFim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Fim *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: São Paulo - SP" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Local de destino da viagem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome do cliente" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Cliente relacionado à viagem (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="proposito"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propósito</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Reunião de negócios, treinamento, visita técnica" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Motivo ou objetivo da viagem
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="reembolsado">Reembolsado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações adicionais sobre o relatório..." 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Informações adicionais sobre o relatório (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="min-w-[120px]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                  
                  <Link href={`/relatorios/${relatorio.id}`}>
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}