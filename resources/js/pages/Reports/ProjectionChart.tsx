import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProjectionCategory, ProjectionResult } from '../../types'

interface Props {
  result: ProjectionResult
  categories: ProjectionCategory[]
  currency?: string
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatEurShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M€`
  if (value >= 1_000)     return `${Math.round(value / 1_000)} k€`
  return `${Math.round(value)} €`
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: number
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Année {label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name} : {formatEur(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function ProjectionChart({ result, categories, currency = 'EUR' }: Props) {
  const { data_points, current_value, projected_value, cumulative_savings, inflation_adjusted } = result

  // Prepend year 0 (current state)
  const chartData = [
    { year: 0, total: current_value },
    ...data_points,
  ]

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tickFormatter={v => v === 0 ? 'Auj.' : `+${v} ans`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            tickFormatter={formatEurShort}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            name="Patrimoine total"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">Valeur actuelle</p>
          <p className="text-base font-bold text-blue-700">{formatEur(current_value)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-xs text-emerald-600 font-medium">
            Valeur projetée{inflation_adjusted ? ' (réelle)' : ''}
          </p>
          <p className="text-base font-bold text-emerald-700">{formatEur(projected_value)}</p>
        </div>
        {cumulative_savings > 0 && (
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">Épargne cumulée</p>
            <p className="text-base font-bold text-amber-700">{formatEur(cumulative_savings)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
