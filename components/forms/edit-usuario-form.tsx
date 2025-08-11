"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Save, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

const EditUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("E-mail inválido"),
  alterarSenha: z.boolean().default(false),
  senha: z.string().optional(),
  confirmarSenha: z.string().optional(),
}).refine((data) => {
  if (data.alterarSenha) {
    if (!data.senha || data.senha.length < 6) {
      return false
    }
    if (data.senha !== data.confirmarSenha) {
      return false
    }
  }
  return true
}, {
  message: "Senha inválida ou senhas não coincidem",
  path: ["confirmarSenha"],
})

type EditUsuarioValues = z.infer<typeof EditUsuarioSchema>

interface Usuario {
  id: number
  nome: string
  email: string
  createdAt: string
  updatedAt: string
}

interface EditUsuarioFormProps {
  usuario: Usuario
}

export function EditUsuarioForm({ usuario }: EditUsuarioFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const form = useForm<EditUsuarioValues>({
    resolver: zodResolver(EditUsuarioSchema),
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
      alterarSenha: false,
      senha: "",
      confirmarSenha: "",
    },
  })

  const watchAlterarSenha = form.watch("alterarSenha")

  const onSubmit = async (data: EditUsuarioValues) => {
    setIsLoading(true)
    try {
      const requestData: any = {
        nome: data.nome,
        email: data.email,
      }

      // Só incluir senha se estiver alterando
      if (data.alterarSenha && data.senha) {
        requestData.senha = data.senha
      }

      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar usuário")
        return
      }

      toast.success("Usuário atualizado com sucesso!")
      router.push("/configuracoes/usuarios")
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast.error("Erro ao atualizar usuário. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          Editar Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: João Silva"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Nome completo do usuário
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Ex: joao@empresa.com"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    E-mail que será usado para fazer login no sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alterar Senha */}
            <FormField
              control={form.control}
              name="alterarSenha"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Alterar Senha
                    </FormLabel>
                    <FormDescription>
                      Ative para alterar a senha do usuário
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

            {/* Campos de senha - só aparecem se alterarSenha estiver ativo */}
            {watchAlterarSenha && (
              <>
                {/* Nova Senha */}
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite a nova senha"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Nova senha deve ter pelo menos 6 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmar Nova Senha */}
                <FormField
                  control={form.control}
                  name="confirmarSenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Digite a nova senha novamente"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Repita a nova senha para confirmação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}