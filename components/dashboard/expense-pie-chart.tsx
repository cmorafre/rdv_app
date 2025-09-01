"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PieChartData {
  name: string
  value: number
  count: number
  color: string
}

interface ExpensePieChartProps {
  data: PieChartData[]
  title: string
  subtitle: string
  total: number
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
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm text-blue-600">
          Valor: {formatCurrency(data.value)}
        </p>
        <p className="text-sm text-gray-600">
          Despesas: {data.count}
        </p>
        <p className="text-sm text-gray-600">
          {((data.value / data.total) * 100).toFixed(1)}% do total
        </p>
      </div>
    )
  }
  return null
}

export function ExpensePieChart({ data, title, subtitle, total }: ExpensePieChartProps) {
  // Preparar dados para o tooltip com total
  const dataWithTotal = data.map(item => ({ ...item, total }))

  if (data.length === 0) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {subtitle} • Total: {formatCurrency(total)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Lista de categorias */}
        <div className="mt-4 space-y-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(item.value)}</div>
                <div className="text-muted-foreground">
                  {item.count} despesa{item.count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
          {data.length > 5 && (
            <div className="text-sm text-muted-foreground text-center pt-2">
              +{data.length - 5} categoria{data.length - 5 !== 1 ? 's' : ''} adiciona{data.length - 5 !== 1 ? 'is' : 'l'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}