import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { MonthlyChartPoint } from '../../types'
import { formatCurrency } from '../../utils/format'

interface EvolutionLineChartProps {
  data: MonthlyChartPoint[]
  showBreakdown?: boolean
}

export default function EvolutionLineChart({ data, showBreakdown = false }: EvolutionLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => formatCurrency(v / 1000, 'EUR').replace('€', '') + 'k€'}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), undefined]}
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
        />
        {showBreakdown && (
          <>
            <Line type="monotone" dataKey="assets" stroke="#10B981" strokeWidth={2} dot={false} name="Actifs" />
            <Line type="monotone" dataKey="liabilities" stroke="#EF4444" strokeWidth={2} dot={false} name="Passifs" strokeDasharray="4 4" />
          </>
        )}
        <Line type="monotone" dataKey="net_worth" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Patrimoine net" />
        {showBreakdown && <Legend wrapperStyle={{ fontSize: 11 }} />}
      </LineChart>
    </ResponsiveContainer>
  )
}
