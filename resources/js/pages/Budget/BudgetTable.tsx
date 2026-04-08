import { budgetColor } from '../../utils/budgetColor'
import type { BudgetSummary } from '../../types/budget'
import { formatCurrency } from '../../utils/format'

interface BudgetTableProps {
  summary: BudgetSummary
  currency: string
}

export default function BudgetTable({ summary, currency }: BudgetTableProps) {
  return (
    <div className="space-y-3">
      {/* Totaux */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Budget total</p>
          <p className="font-bold text-lg">{formatCurrency(summary.total_budget, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Dépensé</p>
          <p className="font-bold text-lg">{formatCurrency(summary.total_spent, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Restant</p>
          <p className={`font-bold text-lg ${summary.total_remaining < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(summary.total_remaining, currency)}
          </p>
        </div>
      </div>

      {/* Tableau par catégorie */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Budget</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Dépensé</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Reste</th>
              <th className="p-3 w-32 font-medium text-muted-foreground">Progression</th>
            </tr>
          </thead>
          <tbody>
            {summary.categories.map(row => {
              const colors = budgetColor(row.rate)
              return (
                <tr key={row.category.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.category.color }}
                      />
                      {row.category.name}
                    </div>
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {row.budget > 0 ? formatCurrency(row.budget, currency) : '—'}
                  </td>
                  <td className={`p-3 text-right font-medium ${row.spent > 0 ? colors.text : 'text-muted-foreground'}`}>
                    {formatCurrency(row.spent, currency)}
                  </td>
                  <td className="p-3 text-right">
                    {row.budget > 0 ? (
                      <span className={row.remaining < 0 ? 'text-red-600 font-medium' : ''}>
                        {formatCurrency(row.remaining, currency)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3">
                    {row.budget > 0 && row.rate !== null ? (
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bar}`}
                            style={{ width: `${Math.min(row.rate, 100)}%` }}
                          />
                        </div>
                        <p className={`text-xs text-right ${colors.text}`}>{row.rate}%</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Non défini</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
