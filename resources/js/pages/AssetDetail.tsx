import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { assetsApi } from '../api/assets'
import { useQuery } from '../hooks/useQuery'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import StatusBadge from '../components/shared/StatusBadge'
import CurrencyDisplay from '../components/shared/CurrencyDisplay'
import QuickUpdateModal from '../components/assets/QuickUpdateModal'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import EvolutionLineChart from '../components/charts/EvolutionLineChart'
import { Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency, formatPercent, FREQUENCY_LABELS } from '../utils/format'
import type { Asset, MonthlyChartPoint } from '../types'

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showUpdate, setShowUpdate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const { data: asset, isLoading, refetch } = useQuery(
    ['assets', Number(id)],
    () => assetsApi.get(Number(id)),
    { enabled: !!id }
  )

  const handleDelete = async () => {
    await assetsApi.delete(Number(id))
    navigate('/assets')
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />
  if (!asset) return <p className="text-destructive text-center mt-10">Actif introuvable.</p>

  // Build chart data from valuations
  const chartData: MonthlyChartPoint[] = (asset.valuations ?? [])
    .slice(0, 24)
    .reverse()
    .map(v => ({
      month: v.recorded_at.slice(0, 7),
      label: new Date(v.recorded_at).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      net_worth: v.value,
      assets: v.value,
      liabilities: 0,
    }))

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to="/assets" className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{asset.name}</h1>
              <StatusBadge variant={asset.status} />
              {asset.is_overdue && <StatusBadge variant="overdue" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {asset.category?.name}
              {asset.platform && ` • ${asset.platform.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpdate(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Mettre à jour
          </button>
          <Link to={`/assets/${id}/edit`} className="p-2 rounded-md border border-border hover:bg-accent transition-colors">
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Link>
          <button onClick={() => setShowDelete(true)} className="p-2 rounded-md border border-border hover:bg-accent transition-colors text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Valeur actuelle</p>
          <CurrencyDisplay value={asset.current_value} currency={asset.currency} size="lg" />
        </Card>
        {asset.initial_value !== undefined && (
          <Card>
            <p className="text-xs text-muted-foreground mb-1">Capital investi</p>
            <CurrencyDisplay value={asset.initial_value} currency={asset.currency} size="lg" />
          </Card>
        )}
        {asset.initial_value !== undefined && (
          <Card>
            <p className="text-xs text-muted-foreground mb-1">Plus/Moins-value</p>
            <CurrencyDisplay value={asset.gain_loss} currency={asset.currency} size="lg" colorize showSign />
          </Card>
        )}
        {asset.estimated_yield !== undefined && (
          <Card>
            <p className="text-xs text-muted-foreground mb-1">Rendement estimé</p>
            <p className="text-lg font-semibold">{asset.estimated_yield} %</p>
          </Card>
        )}
      </div>

      {/* Valuation History Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique de valorisation</CardTitle>
            <span className="text-xs text-muted-foreground">{chartData.length} points</span>
          </CardHeader>
          <EvolutionLineChart data={chartData} />
        </Card>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Devise</dt><dd className="font-medium">{asset.currency}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Date acquisition</dt><dd className="font-medium">{formatDate(asset.acquisition_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Dernière MAJ</dt><dd className="font-medium">{formatDate(asset.last_updated_at)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Fréquence MAJ</dt><dd className="font-medium">{FREQUENCY_LABELS[asset.update_frequency] ?? asset.update_frequency}</dd></div>
          </dl>
        </Card>

        {asset.meta && Object.keys(asset.meta).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Informations spécifiques</CardTitle></CardHeader>
            <dl className="space-y-2 text-sm">
              {Object.entries(asset.meta).map(([key, value]) => (
                value !== null && value !== undefined && value !== '' && (
                  <div key={key} className="flex justify-between">
                    <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                )
              ))}
            </dl>
          </Card>
        )}
      </div>

      {/* Loan Info */}
      {asset.loan && (
        <Card>
          <CardHeader><CardTitle>Détails du prêt</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Montant emprunté</p><p className="font-medium">{formatCurrency(asset.loan.borrowed_amount)}</p></div>
            <div><p className="text-muted-foreground">Capital restant</p><p className="font-medium">{formatCurrency(asset.loan.remaining_capital)}</p></div>
            <div><p className="text-muted-foreground">Taux</p><p className="font-medium">{asset.loan.interest_rate} %</p></div>
            <div><p className="text-muted-foreground">Mensualité</p><p className="font-medium">{asset.loan.monthly_payment ? formatCurrency(asset.loan.monthly_payment) : '—'}</p></div>
          </div>
        </Card>
      )}

      {/* Notes */}
      {asset.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{asset.notes}</p>
        </Card>
      )}

      {/* Modals */}
      {showUpdate && (
        <QuickUpdateModal
          asset={asset} open={showUpdate} onOpenChange={setShowUpdate}
          onUpdated={() => { refetch(); setShowUpdate(false); }}
        />
      )}
      <ConfirmDialog
        open={showDelete} onOpenChange={setShowDelete}
        title="Supprimer cet actif ?"
        description={`"${asset.name}" sera définitivement supprimé avec tout son historique.`}
        confirmLabel="Supprimer" destructive onConfirm={handleDelete}
      />
    </div>
  )
}
