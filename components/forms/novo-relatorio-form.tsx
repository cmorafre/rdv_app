"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { toast } from "sonner"

const RelatorioFormSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  destino: z.string().optional(),
  proposito: z.string().optional(),
  status: z.enum(["em_andamento", "reembolsado"]).default("em_andamento"),
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

type RelatorioFormValues = z.infer<typeof RelatorioFormSchema>

export function NovoRelatorioForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RelatorioFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(RelatorioFormSchema) as any,
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

  const onSubmit = async (data: RelatorioFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/relatorios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar relatório")
        return
      }

      await response.json()
      toast.success("Relatório criado com sucesso!")
      router.push(`/relatorios/todos`)
    } catch (error) {
      console.error("Erro ao criar relatório:", error)
      toast.error("Erro ao criar relatório. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? "Criando..." : "Criar Relatório"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push("/relatorios/todos")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}