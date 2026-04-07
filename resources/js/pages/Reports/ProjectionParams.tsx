import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ProjectionCategory, ProjectionSettings } from '../../types'

interface Props {
  settings: ProjectionSettings
  categories: ProjectionCategory[]
  onHorizonChange: (years: number) => void
  onTargetAgeChange: (age: number) => void
  onCurrentAgeChange: (age: number | null) => void
  onInflationChange: (rate: number) => void
  onCategoryRateChange: (categoryId: number, field: 'growth_rate' | 'monthly_savings', value: number) => void
}

export default function ProjectionParams({
  settings,
  categories,
  onHorizonChange,
  onTargetAgeChange,
  onCurrentAgeChange,
  onInflationChange,
  onCategoryRateChange,
}: Props) {
  const [open, setOpen] = useState(!settings.horizon_years || categories.length === 0)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">Paramètres de projection</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="p-4 space-y-4">
          {/* Horizon + âge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Horizon ({settings.horizon_years} ans)
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={settings.horizon_years}
                onChange={e => onHorizonChange(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1 an</span>
                <span>50 ans</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Âge actuel (optionnel)</label>
              <input
                type="number"
                min={1}
                max={99}
                value={settings.current_age ?? ''}
                placeholder="—"
                onChange={e => onCurrentAgeChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Âge cible (optionnel)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={settings.target_age ?? ''}
                placeholder="—"
                onChange={e => onTargetAgeChange(Number(e.target.value))}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {/* Inflation */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Inflation annuelle (%)
            </label>
            <input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={settings.inflation_rate}
              onChange={e => onInflationChange(Number(e.target.value))}
              className="w-24 border border-gray-200 rounded px-2 py-1.5 text-sm"
            />
            {settings.inflation_rate > 0 && (
              <span className="text-xs text-amber-600">Valeurs en euros constants</span>
            )}
          </div>

          {/* Taux par catégorie */}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Paramètres par catégorie</p>
              <div className="space-y-2">
                {categories.map(cat => {
                  const rates = settings.category_rates[String(cat.id)] ?? { growth_rate: 0, monthly_savings: 0 }
                  return (
                    <div key={cat.id} className="grid grid-cols-3 items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm text-gray-700 truncate">{cat.name}</span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Taux (%/an)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={rates.growth_rate}
                          onChange={e => onCategoryRateChange(cat.id, 'growth_rate', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Épargne (€/mois)</label>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          value={rates.monthly_savings}
                          onChange={e => onCategoryRateChange(cat.id, 'monthly_savings', Number(e.target.value))}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              Ajoutez des actifs pour configurer les paramètres par catégorie.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
