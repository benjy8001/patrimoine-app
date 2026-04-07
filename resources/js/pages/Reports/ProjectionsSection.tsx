import { TrendingUp } from 'lucide-react'
import { useProjection } from '../../hooks/useProjection'
import ProjectionChart from './ProjectionChart'
import ProjectionParams from './ProjectionParams'

export default function ProjectionsSection() {
  const {
    settings,
    categories,
    result,
    isLoading,
    isSaving,
    error,
    saveSettings,
    updateCategoryRate,
    updateHorizon,
    updateTargetAge,
    updateCurrentAge,
    updateInflation,
  } = useProjection()

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">Projections</h2>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Sauvegarde…' : 'Sauvegarder les paramètres'}
        </button>
      </div>

      {/* Parameters panel */}
      <ProjectionParams
        settings={settings}
        categories={categories}
        onHorizonChange={updateHorizon}
        onTargetAgeChange={updateTargetAge}
        onCurrentAgeChange={updateCurrentAge}
        onInflationChange={updateInflation}
        onCategoryRateChange={updateCategoryRate}
      />

      {/* Chart or states */}
      {error && (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      )}

      {!error && isLoading && (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
          Calcul en cours…
        </div>
      )}

      {!error && !isLoading && result && result.data_points.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          Ajoutez des actifs pour générer une projection.
        </p>
      )}

      {!error && !isLoading && result && result.data_points.length > 0 && (
        <ProjectionChart
          result={result}
          categories={categories}
        />
      )}
    </div>
  )
}
