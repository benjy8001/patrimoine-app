import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { assetsApi } from '../api/assets'
import { useMonthlyChart } from '../hooks/useDashboard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import EvolutionLineChart from '../components/charts/EvolutionLineChart'
import { formatCurrency, formatDate } from '../utils/format'
import type { Asset } from '../types'

export default function History() {
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)

  const { data: assets } = useQuery(['assets', 'all'], () => assetsApi.listAll({ status: 'active' }))
  const { data: monthlyData, isLoading: chartLoading } = useMonthlyChart(24)
  const { data: valuations } = useQuery(
    ['valuations', selectedAssetId as number],
    () => assetsApi.getValuations(selectedAssetId!),
    { enabled: !!selectedAssetId }
  )

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Global evolution */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du patrimoine net</CardTitle>
          <span className="text-xs text-muted-foreground">24 derniers mois</span>
        </CardHeader>
        {chartLoading ? (
          <LoadingSpinner className="h-[260px]" />
        ) : monthlyData ? (
          <EvolutionLineChart data={monthlyData} showBreakdown />
        ) : null}
      </Card>

      {/* Per-asset history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique par actif</CardTitle>
          <select
            value={selectedAssetId ?? ''}
            onChange={e => setSelectedAssetId(e.target.value ? Number(e.target.value) : null)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sélectionner un actif...</option>
            {assets?.map((a: Asset) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </CardHeader>

        {selectedAssetId && valuations ? (
          valuations.data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun historique pour cet actif.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase text-right">Valeur</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Source</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {valuations.data.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30">
                      <td className="py-2.5 pr-4">{formatDate(v.recorded_at)}</td>
                      <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(v.value, v.currency)}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground capitalize">{v.source}</td>
                      <td className="py-2.5 text-muted-foreground">{v.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : selectedAssetId ? (
          <LoadingSpinner className="py-6" />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Sélectionnez un actif pour voir son historique.</p>
        )}
      </Card>
    </div>
  )
}
