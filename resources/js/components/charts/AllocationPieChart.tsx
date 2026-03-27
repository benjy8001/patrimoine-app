import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { AllocationItem } from '../../types'
import { formatCurrency } from '../../utils/format'

const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

interface AllocationPieChartProps {
  data: AllocationItem[]
  title?: string
}

export default function AllocationPieChart({ data, title }: AllocationPieChartProps) {
  return (
    <div>
      {title && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [formatCurrency(v), 'Valeur']}
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) =>
              `${value} (${entry?.payload?.percent ?? 0}%)`
            }
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
