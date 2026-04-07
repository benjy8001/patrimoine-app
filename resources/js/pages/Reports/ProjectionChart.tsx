import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../../utils/format'
import type { ProjectionCategory, ProjectionDataPoint, ProjectionResult } from '../../types'

interface Props {
  result: ProjectionResult
  categories: ProjectionCategory[]
  currency?: string
}

function formatShort(value: number, currency: string): string {
  if (value >= 1_000_000) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value / 1_000_000) + ' M' + (currency === 'EUR' ? '€' : currency)
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value / 1_000) + ' k' + (currency === 'EUR' ? '€' : currency)
  }
  return formatCurrency(value, currency)
}

interface ChartDataPoint {
  year: number
  total: number
  breakdown?: Record<string, number>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: number
  chartData: ChartDataPoint[]
  categories: ProjectionCategory[]
  currency: string
}

function CustomTooltip({ active, payload, label, chartData, categories, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const dataPoint = chartData.find(d => d.year === label)
  const total = payload[0]?.value ?? 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-700 mb-1">
        {label === 0 ? "Aujourd'hui" : `Année ${label}`}
      </p>
      <p className="text-blue-600 font-medium mb-1">
        Total : {formatCurrency(total, currency)}
      </p>
      {dataPoint?.breakdown && categories.length > 0 && (
        <div className="border-t border-gray-100 pt-1 mt-1 space-y-0.5">
          {categories.map(cat => {
            const val = dataPoint.breakdown?.[String(cat.id)]
            if (val == null) return null
            return (
              <p key={cat.id} className="text-gray-500 text-xs flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                {cat.name} : {formatCurrency(val, currency)}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProjectionChart({ result, categories, currency = 'EUR' }: Props) {
  const { data_points, current_value, projected_value, cumulative_savings, inflation_adjusted } = result

  // Prepend year 0 (current state)
  const chartData: ChartDataPoint[] = [
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
            tickFormatter={v => formatShort(v, currency)}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={64}
          />
          <Tooltip
            content={
              <CustomTooltip
                chartData={chartData}
                categories={categories}
                currency={currency}
              />
            }
          />
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
          <p className="text-base font-bold text-blue-700">{formatCurrency(current_value, currency)}</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-xs text-emerald-600 font-medium">
            Valeur projetée{inflation_adjusted ? ' (réelle)' : ''}
          </p>
          <p className="text-base font-bold text-emerald-700">{formatCurrency(projected_value, currency)}</p>
        </div>
        {cumulative_savings > 0 && (
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-600 font-medium">Épargne cumulée</p>
            <p className="text-base font-bold text-amber-700">{formatCurrency(cumulative_savings, currency)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
