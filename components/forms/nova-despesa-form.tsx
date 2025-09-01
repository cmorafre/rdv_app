"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CategoriaIcon } from "@/components/categorias/categoria-icon"
import { FileSelector } from "@/components/ui/file-selector"
import { AddressAutocomplete } from "@/components/maps/address-autocomplete"
import { DistanceCalculator } from "@/components/maps/distance-calculator"

const createDespesaSchema = (isQuilometragem: boolean) => z.object({
  relatorioId: z.string().min(1, "Relatório é obrigatório").transform(val => parseInt(val)),
  categoriaId: z.string().min(1, "Categoria é obrigatória").transform(val => parseInt(val)),
  dataDespesa: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória").max(255, "Descrição muito longa"),
  fornecedor: z.string().optional(),
  valor: z.string().min(1, "Valor é obrigatório").transform(val => {
    const num = parseFloat(val.replace(",", "."))
    if (isNaN(num) || num <= 0) {
      throw new Error("Valor deve ser um número positivo")
    }
    return num
  }),
  observacoes: z.string().optional(),
  reembolsavel: z.boolean().default(true),
  clienteACobrar: z.boolean().default(true),
  reembolsada: z.boolean().default(false),
  // Campos específicos para quilometragem
  veiculoId: isQuilometragem 
    ? z.string().min(1, "Veículo é obrigatório para despesas de quilometragem").transform(val => parseInt(val))
    : z.string().optional().transform(val => val ? parseInt(val) : undefined),
  quilometragem: isQuilometragem
    ? z.string().min(1, "Quilometragem é obrigatória").transform(val => {
        const num = parseFloat(val.replace(",", "."))
        if (isNaN(num) || num <= 0) {
          throw new Error("Quilometragem deve ser um número positivo")
        }
        return num
      })
    : z.string().optional().transform(val => val ? parseFloat(val.replace(",", ".")) : undefined),
  origem: isQuilometragem
    ? z.string().min(1, "Origem é obrigatória")
    : z.string().optional(),
  destino: isQuilometragem
    ? z.string().min(1, "Destino é obrigatório") 
    : z.string().optional(),
})

const _DespesaSchema = createDespesaSchema(false)

type DespesaFormValues = z.infer<ReturnType<typeof createDespesaSchema>>

interface Relatorio {
  id: number
  titulo: string
  status: string
}

interface Categoria {
  id: number
  nome: string
  icone?: string
  cor?: string
  ativa: boolean
}

interface Veiculo {
  id: number
  tipo: string
  marca?: string
  modelo?: string
  identificacao: string
  valorPorKm: number | string // Pode vir como Decimal do banco
  ativo: boolean
}

export function NovaDespesaForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isQuilometragem, setIsQuilometragem] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const preSelectedRelatorioId = searchParams.get("relatorio")

  const form = useForm<DespesaFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createDespesaSchema(isQuilometragem)) as any,
    defaultValues: {
      relatorioId: preSelectedRelatorioId ? parseInt(preSelectedRelatorioId) : 0,
      categoriaId: 0,
      dataDespesa: new Date().toISOString().split('T')[0],
      descricao: "",
      fornecedor: "",
      valor: 0,
      observacoes: "",
      reembolsavel: true,
      clienteACobrar: true,
      reembolsada: false,
      veiculoId: undefined,
      quilometragem: undefined,
      origem: undefined,
      destino: undefined,
    },
  })

  // Revalidar form quando schema mudar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const _currentValues = form.getValues()
    form.clearErrors()
    // Resetar resolver com novo schema - comentado por problemas de tipos
    // const newResolver = zodResolver(createDespesaSchema(isQuilometragem))
    // form.setResolver?.(newResolver)
  }, [isQuilometragem])

  // Carregar relatórios, categorias e veículos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadData = async () => {
      try {
        const [relatoriosRes, categoriasRes, veiculosRes] = await Promise.all([
          fetch("/api/relatorios"),
          fetch("/api/categorias"),
          fetch("/api/veiculos")
        ])

        if (relatoriosRes.ok) {
          const relatoriosData = await relatoriosRes.json()
          setRelatorios(relatoriosData.relatorios || [])
        }

        if (categoriasRes.ok) {
          const categoriasData = await categoriasRes.json()
          setCategorias(categoriasData.filter((c: Categoria) => c.ativa))
        }

        if (veiculosRes.ok) {
          const veiculosData = await veiculosRes.json()
          setVeiculos(veiculosData.veiculos?.filter((v: Veiculo) => v.ativo) || [])
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast.error("Erro ao carregar dados do formulário")
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  // Detectar se categoria quilometragem foi selecionada
  useEffect(() => {
    const categoriaId = form.watch("categoriaId")
    if (categorias.length > 0 && categoriaId) {
      const categoria = categorias.find(c => c.id === categoriaId)
      const isKilometragem = categoria?.nome === "Quilometragem"
      setIsQuilometragem(isKilometragem)
      
      if (isKilometragem) {
        // Limpar campos que não são relevantes para quilometragem
        form.setValue("fornecedor", "")
        // Alterar descrição padrão
        if (!form.getValues("descricao")) {
          form.setValue("descricao", "Despesa de quilometragem")
        }
      } else {
        // Limpar campos de quilometragem se não for quilometragem
        form.setValue("veiculoId", undefined)
        form.setValue("quilometragem", undefined)
        form.setValue("origem", undefined)
        form.setValue("destino", undefined)
      }
    }
  }, [form.watch("categoriaId"), categorias])

  // Calcular valor automaticamente para quilometragem
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isQuilometragem) {
      const veiculoId = form.watch("veiculoId")
      const quilometragem = form.watch("quilometragem")
      
      if (veiculoId && quilometragem) {
        const veiculo = veiculos.find(v => v.id === veiculoId)
        if (veiculo) {
          const valorPorKm = parseFloat(veiculo.valorPorKm.toString())
          const valorCalculado = parseFloat(quilometragem.toString()) * valorPorKm
          form.setValue("valor", valorCalculado)
        }
      }
    }
  }, [form.watch("veiculoId"), form.watch("quilometragem"), veiculos, isQuilometragem])

  const uploadFiles = async (despesaId: number) => {
    if (selectedFiles.length === 0) return

    const uploadPromises = selectedFiles.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('despesaId', despesaId.toString())

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Erro ao enviar ${file.name}: ${error.error}`)
      }

      return response.json()
    })

    try {
      await Promise.all(uploadPromises)
      toast.success(`${selectedFiles.length} comprovante(s) enviado(s) com sucesso`)
    } catch (error) {
      console.error('Erro no upload dos arquivos:', error)
      toast.error(error instanceof Error ? error.message : 'Erro no upload de alguns arquivos')
    }
  }

  const onSubmit = async (data: DespesaFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/despesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          fornecedor: data.fornecedor || null,
          observacoes: data.observacoes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar despesa")
        return
      }

      const despesaCriada = await response.json()
      toast.success("Despesa criada com sucesso!")

      // Fazer upload dos arquivos se existirem
      if (selectedFiles.length > 0) {
        await uploadFiles(despesaCriada.id)
      }
      
      // Se veio de um relatório específico, volta para ele
      if (preSelectedRelatorioId) {
        router.push(`/relatorios/${preSelectedRelatorioId}`)
      } else {
        router.push("/despesas/todas")
      }
    } catch (error) {
      console.error("Erro ao criar despesa:", error)
      toast.error("Erro ao criar despesa. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando formulário...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
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
          Nova Despesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Relatório e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="relatorioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relatório *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um relatório" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relatorios.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Nenhum relatório encontrado
                          </SelectItem>
                        ) : (
                          relatorios.map((relatorio) => (
                            <SelectItem key={relatorio.id} value={relatorio.id.toString()}>
                              {relatorio.titulo}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Relatório ao qual esta despesa pertence
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Nenhuma categoria encontrada
                          </SelectItem>
                        ) : (
                          categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id.toString()}>
                              <div className="flex items-center gap-2">
                                <CategoriaIcon 
                                  iconName={categoria.icone}
                                  color={categoria.cor}
                                  size={16}
                                />
                                {categoria.nome}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tipo de despesa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataDespesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Despesa *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0,00"
                        {...field}
                        readOnly={isQuilometragem}
                        onChange={(e) => {
                          if (!isQuilometragem) {
                            // Formatação simples para moeda
                            const value = e.target.value.replace(/[^\d,]/g, '')
                            field.onChange(value)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {isQuilometragem 
                        ? "Valor calculado automaticamente (Km × Valor por Km do veículo)"
                        : "Use vírgula como separador decimal"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campos específicos para quilometragem */}
            {isQuilometragem && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800">Informações da Viagem</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value || ""}
                            onChange={(value) => field.onChange(value)}
                            placeholder="Digite o endereço de origem"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Endereço ou cidade de origem (com autocomplete)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value || ""}
                            onChange={(value) => field.onChange(value)}
                            placeholder="Digite o endereço de destino"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          Endereço ou cidade de destino (com autocomplete)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calculadora de Distância */}
                {form.watch("origem") && form.watch("destino") && (
                  <DistanceCalculator
                    origin={form.watch("origem") || ""}
                    destination={form.watch("destino") || ""}
                    onDistanceCalculated={(distanceKm) => {
                      form.setValue("quilometragem", distanceKm)
                    }}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="veiculoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {veiculos.map((veiculo) => (
                              <SelectItem key={veiculo.id} value={veiculo.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {veiculo.identificacao} - {veiculo.tipo}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {veiculo.marca} {veiculo.modelo} - R$ {parseFloat(veiculo.valorPorKm.toString()).toFixed(2)}/km
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quilometragem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distância (Km) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Distância percorrida em quilômetros
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Táxi do aeroporto para hotel"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Descrição detalhada da despesa
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fornecedor */}
            <FormField
              control={form.control}
              name="fornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Uber, Hotel XYZ, Restaurante ABC..."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Estabelecimento ou prestador de serviço (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre a despesa..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Configurações de Reembolso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações de Reembolso</h3>
              
              {/* Informação fixa sobre o status */}
              <div className="rounded-lg border p-4 bg-blue-50">
                <div className="space-y-0.5">
                  <div className="text-base font-medium text-blue-900">
                    Status do Reembolso
                  </div>
                  <div className="text-sm text-blue-700">
                    A Reembolsar pelo Cliente (Padrão)
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="reembolsada"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Já Reembolsada
                      </FormLabel>
                      <FormDescription>
                        Esta despesa já foi reembolsada
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

              <FormField
                control={form.control}
                name="reembolsada"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Já foi Reembolsada?
                      </FormLabel>
                      <FormDescription>
                        Marque se esta despesa já foi reembolsada pelo cliente
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
            </div>

            {/* Comprovantes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Comprovantes</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Anexe comprovantes da despesa (recibos, notas fiscais, cupons, etc.)
                </p>
                <FileSelector
                  onFilesChange={setSelectedFiles}
                  disabled={isLoading}
                />
              </div>
            </div>

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
                    {selectedFiles.length > 0 
                      ? `Salvando e enviando ${selectedFiles.length} arquivo(s)...`
                      : 'Salvando...'
                    }
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {selectedFiles.length > 0 
                      ? `Salvar e Enviar ${selectedFiles.length} Arquivo(s)`
                      : 'Salvar Despesa'
                    }
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