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
  LucideIcon
} from "lucide-react"

// Mapeamento de strings para componentes de ícones
const iconMap: Record<string, LucideIcon> = {
  'car': Car,
  'plane': Plane,
  'fuel': Fuel,
  'more-horizontal': MoreHorizontal,
  'parking-circle': ParkingCircle,
  'bed': Bed,
  'wifi': Wifi,
  'banknote': Banknote,
  'coins': Coins,
  'gauge': Gauge,
  'utensils': Utensils,
  'phone': Phone,
  'bus': Bus,
  'train': Train,
  'tag': Tag,
}

interface CategoriaIconProps {
  iconName?: string
  color?: string
  size?: number
  className?: string
}

export function CategoriaIcon({ 
  iconName, 
  color = "#6b7280", 
  size = 16, 
  className = "" 
}: CategoriaIconProps) {
  // Se não houver nome do ícone, usa o ícone padrão
  const IconComponent = iconName ? iconMap[iconName] || Tag : Tag

  return (
    <IconComponent 
      size={size} 
      style={{ color }} 
      className={className}
    />
  )
}