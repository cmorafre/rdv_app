"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Save, X } from "lucide-react"
import { toast } from "sonner"
import { IconSelector } from "./icon-selector"

const CategoriaEditSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  icone: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)").optional(),
  ativa: z.boolean(),
})

type CategoriaEditValues = z.infer<typeof CategoriaEditSchema>

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
  ativa: boolean
  createdAt: string
}

interface EditCategoriaDialogProps {
  categoria: Categoria
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (categoria: Categoria) => void
}

export function EditCategoriaDialog({ 
  categoria, 
  open, 
  onOpenChange, 
  onUpdate 
}: EditCategoriaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CategoriaEditValues>({
    resolver: zodResolver(CategoriaEditSchema),
    defaultValues: {
      nome: categoria.nome || "",
      icone: categoria.icone || "",
      cor: categoria.cor || "#3b82f6",
      ativa: categoria.ativa,
    },
  })

  const onSubmit = async (data: CategoriaEditValues) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "PUT",
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
        toast.error(error.error || "Erro ao atualizar categoria")
        return
      }

      const updatedCategoria = await response.json()
      toast.success("Categoria atualizada com sucesso!")
      onUpdate(updatedCategoria)
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Atualize as informações da categoria &ldquo;{categoria.nome}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Transporte, Alimentação..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ativa"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Categoria Ativa</FormLabel>
                    <FormDescription className="text-xs">
                      Categorias ativas aparecem na seleção de despesas
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}