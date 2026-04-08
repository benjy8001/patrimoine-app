import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { budgetSummaryApi } from '../../api/budget'
import type { BudgetEvolution } from '../../types/budget'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { formatCurrency } from '../../utils/format'

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

export default function BudgetChart() {
  const currentYear = new Date().getFullYear()
  const [year, setYear]           = useState(currentYear)
  const [data, setData]           = useState<BudgetEvolution | null>(null)
  const [isLoading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    budgetSummaryApi.getEvolution(year)
      .then(setData)
      .finally(() => setLoading(false))
  }, [year])

  if (isLoading) return <LoadingSpinner className="mt-10" />

  if (!data || data.months.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Aucune dépense enregistrée pour {year}.
      </div>
    )
  }

  const allCategories = Array.from(
    new Map(
      data.months.flatMap(m => m.by_category).map(c => [c.category_id, c])
    ).values()
  )

  const chartData = data.months.map(m => {
    const row: Record<string, number | string> = { name: MONTHS_SHORT[m.month - 1] }
    allCategories.forEach(cat => {
      const found = m.by_category.find(c => c.category_id === cat.category_id)
      row[cat.name] = found ? found.amount : 0
    })
    return row
  })

  const currency = data.currency

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Évolution des dépenses</h3>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}€`} />
          <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
          <Legend />
          {allCategories.map(cat => (
            <Bar key={cat.category_id} dataKey={cat.name} stackId="a" fill={cat.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
