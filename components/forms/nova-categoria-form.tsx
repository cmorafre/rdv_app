"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
import { IconSelector } from "@/components/categorias/icon-selector"

const CategoriaFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  icone: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)").optional(),
  ativa: z.boolean().default(true),
})

type CategoriaFormValues = z.infer<typeof CategoriaFormSchema>

export function NovaCategoriaForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CategoriaFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CategoriaFormSchema) as any,
    defaultValues: {
      nome: "",
      icone: "",
      cor: "#3b82f6",
      ativa: true,
    },
  })

  const onSubmit = async (data: CategoriaFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          icone: data.icone || null,
          cor: data.cor || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar categoria")
        return
      }

      toast.success("Categoria criada com sucesso!")
      router.push("/categorias/todas")
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast.error("Erro ao criar categoria. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Categoria</CardTitle>
        <CardDescription>
          Crie uma nova categoria de despesas para organizar seus gastos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Transporte, Alimentação, Hospedagem..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Nome único para identificar a categoria
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="icone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <FormControl>
                      <IconSelector
                        selectedIcon={field.value || ""}
                        onIconSelect={field.onChange}
                        color={form.watch("cor") || "#3b82f6"}
                      />
                    </FormControl>
                    <FormDescription>
                      Escolha um ícone para representar sua categoria (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          type="color"
                          className="w-12 h-10 p-1 border rounded cursor-pointer"
                          {...field}
                        />
                        <Input 
                          placeholder="#3b82f6" 
                          {...field}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Cor da categoria em formato hexadecimal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ativa"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Categoria Ativa</FormLabel>
                    <FormDescription>
                      Categorias ativas aparecem na lista de seleção ao criar despesas
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Criar Categoria"}
              </Button>
              
              <Link href="/categorias/todas">
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}