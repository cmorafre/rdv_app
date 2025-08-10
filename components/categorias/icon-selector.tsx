"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { 
  Car, 
  Plane, 
  Fuel, 
  MoreHorizontal, 
  ParkingCircle, 
  Bed, 
  Wifi, 
  Banknote, 
  Coins, 
  Gauge, 
  Utensils, 
  Phone, 
  Bus, 
  Train,
  Tag,
  Search,
  Check
} from "lucide-react"
import { CategoriaIcon } from "./categoria-icon"

// Lista de ícones disponíveis com seus nomes e componentes
const availableIcons = [
  { name: 'car', label: 'Carro', component: Car },
  { name: 'plane', label: 'Avião', component: Plane },
  { name: 'fuel', label: 'Combustível', component: Fuel },
  { name: 'parking-circle', label: 'Estacionamento', component: ParkingCircle },
  { name: 'bed', label: 'Hospedagem', component: Bed },
  { name: 'wifi', label: 'Internet/Wifi', component: Wifi },
  { name: 'banknote', label: 'Dinheiro', component: Banknote },
  { name: 'coins', label: 'Moedas', component: Coins },
  { name: 'gauge', label: 'Combustível/Medidor', component: Gauge },
  { name: 'utensils', label: 'Alimentação', component: Utensils },
  { name: 'phone', label: 'Telefone', component: Phone },
  { name: 'bus', label: 'Ônibus', component: Bus },
  { name: 'train', label: 'Trem', component: Train },
  { name: 'more-horizontal', label: 'Outros', component: MoreHorizontal },
  { name: 'tag', label: 'Etiqueta', component: Tag },
]

interface IconSelectorProps {
  selectedIcon?: string
  onIconSelect: (iconName: string) => void
  color?: string
}

export function IconSelector({ selectedIcon, onIconSelect, color = "#6b7280" }: IconSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Garantir que selectedIcon nunca seja undefined
  const safeSelectedIcon = selectedIcon || ""

  // Filtrar ícones baseado na busca
  const filteredIcons = availableIcons.filter(icon =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleIconSelect = (iconName: string) => {
    onIconSelect(iconName)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-10"
        >
          <div className="flex items-center gap-2">
            {safeSelectedIcon ? (
              <>
                <CategoriaIcon 
                  iconName={safeSelectedIcon}
                  color={color}
                  size={18}
                />
                <span className="capitalize">
                  {availableIcons.find(icon => icon.name === safeSelectedIcon)?.label || safeSelectedIcon}
                </span>
              </>
            ) : (
              <>
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Selecionar ícone</span>
              </>
            )}
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Ícone</DialogTitle>
          <DialogDescription>
            Escolha um ícone para representar sua categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar ícone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Grade de ícones */}
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {filteredIcons.map((icon) => (
              <Button
                key={icon.name}
                type="button"
                variant={safeSelectedIcon === icon.name ? "default" : "outline"}
                className="h-16 flex flex-col items-center justify-center gap-1 p-2 relative"
                onClick={() => handleIconSelect(icon.name)}
              >
                {safeSelectedIcon === icon.name && (
                  <Check className="absolute top-1 right-1 h-3 w-3" />
                )}
                <CategoriaIcon 
                  iconName={icon.name}
                  color={safeSelectedIcon === icon.name ? "#ffffff" : color}
                  size={20}
                />
                <span className="text-xs truncate w-full text-center">
                  {icon.label}
                </span>
              </Button>
            ))}
          </div>

          {/* Caso não encontre ícones */}
          {filteredIcons.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum ícone encontrado</p>
              <p className="text-sm">Tente um termo diferente</p>
            </div>
          )}

          {/* Botão para limpar seleção */}
          {safeSelectedIcon && (
            <div className="flex justify-center pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleIconSelect("")}
                className="text-muted-foreground"
              >
                Remover ícone selecionado
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}