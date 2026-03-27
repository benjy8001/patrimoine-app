import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { assetsApi } from '../api/assets'
import { useQuery } from '../hooks/useQuery'
import AssetTable from '../components/assets/AssetTable'
import ImportCsvModal from '../components/assets/ImportCsvModal'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import EmptyState from '../components/shared/EmptyState'
import { Package, Plus, Search, Upload, X } from 'lucide-react'
import { Card } from '../components/shared/Card'
import CurrencyDisplay from '../components/shared/CurrencyDisplay'
import type { Asset } from '../types'

export default function AssetList() {
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [catFilter, setCat]         = useState('')
  const [liabilityFilter, setLiab]  = useState('false')
  const [showImport, setShowImport] = useState(false)

  const isLiabilityParam = liabilityFilter === '' ? undefined : liabilityFilter

  const { data, isLoading, refetch } = useQuery(
    ['assets', 'list', search, statusFilter, catFilter, liabilityFilter],
    () => assetsApi.listAll({
      search: search || undefined,
      status: statusFilter || undefined,
      category: catFilter || undefined,
      ...(isLiabilityParam !== undefined ? { is_liability: isLiabilityParam } : {}),
    }),
    { enabled: true }
  )

  const assets = data ?? []

  const totalValue = assets.reduce((sum, a: Asset) => sum + a.current_value, 0)
  const overdueCount = assets.filter((a: Asset) => a.is_overdue).length

  const handleDelete = useCallback(async (id: number) => {
    await assetsApi.delete(id)
    refetch()
  }, [refetch])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Total actifs</p>
            <CurrencyDisplay value={totalValue} size="lg" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nombre d'actifs</p>
            <p className="text-lg font-semibold">{assets.length}</p>
          </div>
          {overdueCount > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">En retard de MAJ</p>
              <p className="text-lg font-semibold text-orange-500">{overdueCount}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer CSV
          </button>
          <Link
            to="/assets/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel actif
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un actif..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-56"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="closed">Clôturé</option>
          <option value="pending">En attente</option>
        </select>
        <select
          value={liabilityFilter}
          onChange={e => setLiab(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="false">Actifs</option>
          <option value="true">Passifs</option>
          <option value="">Tous</option>
        </select>
        {(search || statusFilter || catFilter) && (
          <button onClick={() => { setSearch(''); setStatus(''); setCat(''); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" /> Effacer
          </button>
        )}
      </div>

      {/* Table */}
      <Card padding="md">
        {isLoading ? (
          <LoadingSpinner className="py-10" />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun actif"
            description="Ajoutez votre premier actif pour commencer le suivi de votre patrimoine."
            action={
              <Link to="/assets/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Ajouter un actif
              </Link>
            }
          />
        ) : (
          <AssetTable assets={assets} onDelete={handleDelete} />
        )}
      </Card>

      <ImportCsvModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={refetch}
      />
    </div>
  )
}
