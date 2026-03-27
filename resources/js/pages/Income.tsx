import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { incomeApi } from '../api/income'
import { assetsApi } from '../api/assets'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import { TrendingUp, Plus, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, INCOME_TYPE_LABELS } from '../utils/format'
import type { IncomeEntry, IncomeType } from '../types'

export default function Income() {
  const currentYear = new Date().getFullYear()
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({
    asset_id: '', income_type: 'interest', amount: '', currency: 'EUR',
    fiscal_year: String(currentYear), received_at: '', is_taxable: true, tax_category: '', notes: '',
  })

  const { data, isLoading, refetch } = useQuery(
    ['income', yearFilter],
    () => incomeApi.list({ year: yearFilter, per_page: 100 })
  )

  const { data: assets } = useQuery(['assets', 'all'], () => assetsApi.listAll())

  const entries: IncomeEntry[] = data?.data ?? []
  const totalTaxable = entries.filter(e => e.is_taxable).reduce((s, e) => s + e.amount, 0)
  const totalAll = entries.reduce((s, e) => s + e.amount, 0)

  const byType = Object.entries(
    entries.reduce((acc, e) => {
      acc[e.income_type] = (acc[e.income_type] ?? 0) + e.amount
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await incomeApi.create({
      ...form,
      income_type: form.income_type as IncomeType,
      asset_id: form.asset_id ? Number(form.asset_id) : undefined,
      amount: parseFloat(form.amount),
      fiscal_year: Number(form.fiscal_year),
    })
    setShowForm(false)
    refetch()
  }

  const handleDelete = async () => {
    if (deleteId) { await incomeApi.delete(deleteId); setDeleteId(null); refetch() }
  }

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Année :</label>
          <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))} className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Saisir un revenu
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Total revenus {yearFilter}</p>
          <p className="text-xl font-bold">{formatCurrency(totalAll)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Revenus imposables</p>
          <p className="text-xl font-bold">{formatCurrency(totalTaxable)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Entrées</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </Card>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <h3 className="font-semibold text-sm mb-4">Saisir un revenu</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type de revenu *</label>
                <select value={form.income_type} onChange={e => setForm(f => ({ ...f, income_type: e.target.value }))} className={inputClass}>
                  {Object.entries(INCOME_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Actif associé</label>
                <select value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))} className={inputClass}>
                  <option value="">Aucun</option>
                  {assets?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Montant *</label>
                <input type="number" required step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Devise</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputClass}>
                  {['EUR', 'USD', 'GBP', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date de réception *</label>
                <input type="date" required value={form.received_at} onChange={e => setForm(f => ({ ...f, received_at: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Année fiscale</label>
                <input type="number" value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Case fiscale (optionnel)</label>
                <input type="text" value={form.tax_category} onChange={e => setForm(f => ({ ...f, tax_category: e.target.value }))} className={inputClass} placeholder="Ex: 2TR" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_taxable" checked={form.is_taxable} onChange={e => setForm(f => ({ ...f, is_taxable: e.target.checked }))} />
              <label htmlFor="is_taxable" className="text-sm">Revenu imposable</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">Annuler</button>
            </div>
          </form>
        </Card>
      )}

      {/* By type */}
      {byType.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Répartition par type</CardTitle></CardHeader>
          <div className="space-y-2">
            {byType.map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{INCOME_TYPE_LABELS[type] ?? type}</span>
                <span className="font-semibold text-sm">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Entries table */}
      <Card>
        <CardHeader><CardTitle>Entrées de revenus {yearFilter}</CardTitle></CardHeader>
        {entries.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Aucun revenu" description="Saisissez vos revenus (intérêts, dividendes, loyers, etc.) pour préparer votre déclaration fiscale." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Actif</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase text-right">Montant</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Case</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e: IncomeEntry) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-4">{e.asset?.name ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{INCOME_TYPE_LABELS[e.income_type] ?? e.income_type}</td>
                    <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(e.amount, e.currency)}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground text-xs">{formatDate(e.received_at)}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-primary">{e.tax_category ?? '—'}</td>
                    <td className="py-2.5">
                      <button onClick={() => setDeleteId(e.id)} className="p-1 rounded hover:bg-accent transition-colors text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)} title="Supprimer ce revenu ?" confirmLabel="Supprimer" destructive onConfirm={handleDelete} />
    </div>
  )
}
