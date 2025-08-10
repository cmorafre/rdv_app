"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const novoVeiculoSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  categoria: z.string().optional(),
  combustivel: z.string().optional(),
  identificacao: z.string().min(1, "Identificação é obrigatória"),
  potencia: z.string().optional(),
  valorPorKm: z.string().min(1, "Valor por Km é obrigatório"),
  ativo: z.boolean().default(true)
})

type NovoVeiculoFormData = z.infer<typeof novoVeiculoSchema>

export function NovoVeiculoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<NovoVeiculoFormData>({
    resolver: zodResolver(novoVeiculoSchema),
    defaultValues: {
      tipo: "",
      marca: "",
      modelo: "",
      categoria: "",
      combustivel: "",
      identificacao: "",
      potencia: "",
      valorPorKm: "",
      ativo: true
    }
  })

  const onSubmit = async (data: NovoVeiculoFormData) => {
    try {
      setLoading(true)

      // Converter campos numéricos
      const formattedData = {
        ...data,
        potencia: data.potencia ? parseInt(data.potencia) : null,
        valorPorKm: parseFloat(data.valorPorKm.replace(',', '.'))
      }

      const response = await fetch('/api/veiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Erro ao criar veículo')
        return
      }

      router.push('/veiculos/todos')
    } catch (error) {
      console.error('Erro ao criar veículo:', error)
      alert('Erro ao criar veículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Veículo</CardTitle>
        <CardDescription>
          Adicione um novo veículo para o cálculo de despesas de quilometragem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Carro">Carro</SelectItem>
                        <SelectItem value="Moto">Moto</SelectItem>
                        <SelectItem value="Caminhão">Caminhão</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Ônibus">Ônibus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="identificacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificação *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: ABC-1234, Placa, Código..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Placa, código interno ou outro identificador único
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Toyota, Honda, Volkswagen..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Corolla, Civic, Gol..."
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
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Sedan, Hatch, SUV..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gasolina">Gasolina</SelectItem>
                        <SelectItem value="Álcool">Álcool</SelectItem>
                        <SelectItem value="Flex">Flex</SelectItem>
                        <SelectItem value="Diesel">Diesel</SelectItem>
                        <SelectItem value="GNV">GNV</SelectItem>
                        <SelectItem value="Elétrico">Elétrico</SelectItem>
                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="potencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potência (CV)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 150"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Potência em cavalos (CV)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorPorKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor por Km *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 0.65"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor a ser pago por quilômetro rodado (R$)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Veículo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}