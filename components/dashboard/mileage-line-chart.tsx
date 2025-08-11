"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LineChartData {
  month: string
  monthFull: string
  quilometragem: number
  viagens: number
  valor: number
  date: Date
}

interface MileageLineChartProps {
  data: LineChartData[]
  title: string
  subtitle: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="font-semibold">{data.monthFull}</p>
        <p className="text-sm text-green-600">
          Quilometragem: {data.quilometragem.toLocaleString('pt-BR')} km
        </p>
        <p className="text-sm text-blue-600">
          Valor: {formatCurrency(data.valor)}
        </p>
        <p className="text-sm text-gray-600">
          {data.viagens} viagen{data.viagens !== 1 ? 's' : ''}
        </p>
        {data.quilometragem > 0 && (
          <p className="text-sm text-gray-600">
            Média: {formatCurrency(data.valor / data.quilometragem)}/km
          </p>
        )}
      </div>
    )
  }
  return null
}

export function MileageLineChart({ data, title, subtitle }: MileageLineChartProps) {
  if (data.length === 0 || data.every(item => item.quilometragem === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
              <p>Nenhum dado de quilometragem</p>
              <p className="text-sm">Crie despesas de quilometragem para ver o gráfico</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estatísticas
  const totalKm = data.reduce((acc, item) => acc + item.quilometragem, 0)
  const totalValue = data.reduce((acc, item) => acc + item.valor, 0)
  const avgKmPerMonth = totalKm / data.filter(item => item.quilometragem > 0).length || 0
  const avgCostPerKm = totalValue / totalKm || 0
  const maxKm = Math.max(...data.map(item => item.quilometragem))
  const maxKmMonth = data.find(item => item.quilometragem === maxKm)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {subtitle} • Média: {avgKmPerMonth.toFixed(0)} km/mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => `${(value/1000).toFixed(0)}k km`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="quilometragem"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorKm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas adicionais */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-semibold text-green-600">
              {totalKm.toLocaleString('pt-BR')} km
            </div>
            <div className="text-muted-foreground">Total percorrido</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-semibold text-blue-600">
              {formatCurrency(avgCostPerKm)}/km
            </div>
            <div className="text-muted-foreground">Custo médio</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-semibold text-orange-600">
              {maxKmMonth?.month}
            </div>
            <div className="text-muted-foreground">
              Pico ({maxKm.toLocaleString('pt-BR')} km)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}