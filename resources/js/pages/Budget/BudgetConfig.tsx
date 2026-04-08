import { useState, useEffect } from 'react'
import { budgetsApi, expenseCategoriesApi } from '../../api/budget'
import type { Budget, ExpenseCategory } from '../../types/budget'

interface BudgetConfigProps {
  month: number
  year: number
  onUpdated: () => void
}

const MONTHS = ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.']

export default function BudgetConfig({ month, year, onUpdated }: BudgetConfigProps) {
  const [categories, setCategories]   = useState<ExpenseCategory[]>([])
  const [budgets, setBudgets]         = useState<Budget[]>([])
  const [amounts, setAmounts]         = useState<Record<number, string>>({})
  const [overrides, setOverrides]     = useState<Record<number, boolean>>({})
  const [saving, setSaving]           = useState<Record<number, boolean>>({})
  const [isLoading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      expenseCategoriesApi.list(),
      budgetsApi.list({ month, year }),
    ]).then(([cats, buds]) => {
      setCategories(cats)
      setBudgets(buds)

      const initAmounts: Record<number, string> = {}
      const initOverrides: Record<number, boolean> = {}
      cats.forEach(cat => {
        const override = buds.find(b => b.expense_category_id === cat.id && b.month === month && b.year === year)
        const recurring = buds.find(b => b.expense_category_id === cat.id && b.month === null && b.year === null)
        if (override) {
          initAmounts[cat.id] = String(parseFloat(override.amount))
          initOverrides[cat.id] = true
        } else if (recurring) {
          initAmounts[cat.id] = String(parseFloat(recurring.amount))
          initOverrides[cat.id] = false
        } else {
          initAmounts[cat.id] = ''
          initOverrides[cat.id] = false
        }
      })
      setAmounts(initAmounts)
      setOverrides(initOverrides)
      setLoading(false)
    })
  }, [month, year])

  const handleSave = async (cat: ExpenseCategory) => {
    const val = parseFloat(amounts[cat.id] ?? '')
    if (isNaN(val) || val < 0) return

    setSaving(prev => ({ ...prev, [cat.id]: true }))
    try {
      await budgetsApi.upsert({
        expense_category_id: cat.id,
        amount:   val,
        currency: 'EUR',
        month:    overrides[cat.id] ? month : null,
        year:     overrides[cat.id] ? year  : null,
      })
      onUpdated()
    } finally {
      setSaving(prev => ({ ...prev, [cat.id]: false }))
    }
  }

  const inputClass = "border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-28 text-right"

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Chargement...</p>

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Définissez un montant récurrent (appliqué chaque mois) ou cochez pour définir un montant spécifique pour {MONTHS[month - 1]} {year}.
      </p>
      {categories.map(cat => (
        <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
          <span className="text-sm flex-1">{cat.name}</span>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={overrides[cat.id] ?? false}
              onChange={e => setOverrides(prev => ({ ...prev, [cat.id]: e.target.checked }))}
              className="rounded"
            />
            Override {MONTHS[month - 1]}
          </label>

          <input
            type="number"
            value={amounts[cat.id] ?? ''}
            onChange={e => setAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))}
            onBlur={() => handleSave(cat)}
            step="1"
            min="0"
            placeholder="0 €"
            className={inputClass}
          />

          <span className="text-xs text-muted-foreground w-6">€</span>

          {saving[cat.id] && <span className="text-xs text-muted-foreground">...</span>}
        </div>
      ))}
    </div>
  )
}
