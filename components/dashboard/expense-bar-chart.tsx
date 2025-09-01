"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BarChartData {
  month: string
  monthFull: string
  valor: number
  quantidade: number
  date: Date
}

interface ExpenseBarChartProps {
  data: BarChartData[]
  title: string
  subtitle: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border rounded-lg shadow-md">
        <p className="font-semibold">{data.monthFull}</p>
        <p className="text-sm text-blue-600">
          Total: {formatCurrency(data.valor)}
        </p>
        <p className="text-sm text-gray-600">
          {data.quantidade} despesa{data.quantidade !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }
  return null
}

export function ExpenseBarChart({ data, title, subtitle }: ExpenseBarChartProps) {
  if (data.length === 0 || data.every(item => item.valor === 0)) {
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
                <span className="text-2xl">📊</span>
              </div>
              <p>Nenhum dado disponível</p>
              <p className="text-sm">Crie algumas despesas para ver o gráfico</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estatísticas
  const totalValue = data.reduce((acc, item) => acc + item.valor, 0)
  const avgValue = totalValue / data.length
  const maxValue = Math.max(...data.map(item => item.valor))
  const maxMonth = data.find(item => item.valor === maxValue)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {subtitle} • Média mensal: {formatCurrency(avgValue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('R$', 'R$').slice(0, -3) + 'k'}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="valor" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas adicionais */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-semibold text-green-600">{formatCurrency(totalValue)}</div>
            <div className="text-muted-foreground">Total do período</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="font-semibold text-blue-600">{maxMonth?.month}</div>
            <div className="text-muted-foreground">Maior gasto ({formatCurrency(maxValue)})</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}