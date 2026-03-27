import { Link } from 'react-router-dom'
import { useQuery } from '../hooks/useQuery'
import { assetsApi } from '../api/assets'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import EmptyState from '../components/shared/EmptyState'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import CurrencyDisplay from '../components/shared/CurrencyDisplay'
import { CreditCard, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'
import type { Asset } from '../types'

export default function Liabilities() {
  const { data, isLoading } = useQuery(
    ['assets', 'liabilities'],
    () => assetsApi.listAll({ is_liability: true, all: true })
  )

  const liabilities: Asset[] = data ?? []
  const total = liabilities.reduce((s, a) => s + a.current_value, 0)

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total passifs</p>
          <CurrencyDisplay value={total} size="xl" />
        </div>
        <Link to="/assets/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau passif
        </Link>
      </div>

      {liabilities.length === 0 ? (
        <EmptyState icon={CreditCard} title="Aucun passif" description="Ajoutez vos emprunts, crédits et dettes pour calculer votre patrimoine net réel." />
      ) : (
        <div className="space-y-4">
          {liabilities.map(asset => (
            <Card key={asset.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">{asset.category?.name} {asset.platform ? `• ${asset.platform.name}` : ''}</p>
                </div>
                <div className="text-right">
                  <CurrencyDisplay value={asset.current_value} currency={asset.currency} size="lg" />
                  <p className="text-xs text-muted-foreground">MAJ : {formatDate(asset.last_updated_at)}</p>
                </div>
              </div>
              {asset.loan && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Capital emprunté</p><p className="font-medium">{formatCurrency(asset.loan.borrowed_amount)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Capital restant</p><p className="font-medium">{formatCurrency(asset.loan.remaining_capital)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Taux</p><p className="font-medium">{asset.loan.interest_rate} %</p></div>
                  <div><p className="text-xs text-muted-foreground">Mensualité</p><p className="font-medium">{asset.loan.monthly_payment ? formatCurrency(asset.loan.monthly_payment) : '—'}</p></div>
                  {asset.loan.end_date && <div><p className="text-xs text-muted-foreground">Fin le</p><p className="font-medium">{formatDate(asset.loan.end_date)}</p></div>}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Link to={`/assets/${asset.id}`} className="text-xs text-primary hover:underline">Voir détail →</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
