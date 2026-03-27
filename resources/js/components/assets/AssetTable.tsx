import { Link } from 'react-router-dom'
import type { Asset } from '../../types'
import StatusBadge from '../shared/StatusBadge'
import CurrencyDisplay from '../shared/CurrencyDisplay'
import { formatRelativeDate, formatPercent } from '../../utils/format'
import { AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface AssetTableProps {
  assets: Asset[]
  onDelete?: (id: number) => void
}

export default function AssetTable({ assets, onDelete }: AssetTableProps) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Aucun actif trouvé.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase">Nom</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase">Catégorie</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase">Plateforme</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase text-right">Valeur</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase text-right">P/L</th>
            <th className="pb-3 pr-4 font-medium text-muted-foreground text-xs uppercase">MAJ</th>
            <th className="pb-3 font-medium text-muted-foreground text-xs uppercase">Statut</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.map(asset => (
            <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  {asset.is_overdue && <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    {asset.currency !== 'EUR' && (
                      <p className="text-xs text-muted-foreground">{asset.currency}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  {asset.category?.color && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: asset.category.color }} />
                  )}
                  <span className="text-muted-foreground">{asset.category?.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{asset.platform?.name ?? '—'}</td>
              <td className="py-3 pr-4 text-right">
                <CurrencyDisplay value={asset.current_value} currency={asset.currency} />
              </td>
              <td className="py-3 pr-4 text-right">
                {asset.initial_value ? (
                  <span className={cn(
                    'text-xs font-medium',
                    asset.gain_loss > 0 ? 'text-green-600' : asset.gain_loss < 0 ? 'text-red-500' : 'text-muted-foreground'
                  )}>
                    {formatPercent(asset.gain_loss_percent)}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="py-3 pr-4 text-muted-foreground text-xs">{formatRelativeDate(asset.last_updated_at)}</td>
              <td className="py-3 pr-4">
                <StatusBadge variant={asset.status} />
              </td>
              <td className="py-3">
                <Link to={`/assets/${asset.id}`} className="p-1 rounded hover:bg-accent transition-colors">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
