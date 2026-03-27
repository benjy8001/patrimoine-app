import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assetsApi } from '../api/assets'
import { categoriesApi } from '../api/categories'
import { platformsApi } from '../api/platforms'
import { useQuery } from '../hooks/useQuery'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AssetCategory, Platform } from '../types'

const CATEGORY_META_FIELDS: Record<string, { key: string; label: string; type: string; placeholder?: string }[]> = {
  'bank-accounts':  [{ key: 'iban_masked', label: 'IBAN masqué', type: 'text', placeholder: 'FR76 **** **** 1234' }, { key: 'account_type', label: 'Type de compte', type: 'text', placeholder: 'courant, épargne...' }],
  'crypto':         [{ key: 'token', label: 'Token', type: 'text', placeholder: 'BTC, ETH...' }, { key: 'quantity', label: 'Quantité', type: 'number' }, { key: 'average_buy_price', label: "Prix d'achat moyen", type: 'number' }, { key: 'wallet', label: 'Wallet / Exchange', type: 'text' }],
  'stocks':         [{ key: 'isin', label: 'ISIN', type: 'text' }, { key: 'shares', label: "Nombre de titres", type: 'number' }, { key: 'average_price', label: "PRU (€)", type: 'number' }, { key: 'dividends', label: "Dividendes perçus (€)", type: 'number' }],
  'scpi':           [{ key: 'shares_count', label: 'Nombre de parts', type: 'number' }, { key: 'share_price', label: 'Prix de part (€)', type: 'number' }, { key: 'management_company', label: 'Société de gestion', type: 'text' }, { key: 'distributed_income', label: 'Revenus distribués (€)', type: 'number' }],
  'real-estate':    [{ key: 'address', label: 'Adresse', type: 'text' }, { key: 'area_sqm', label: 'Surface (m²)', type: 'number' }, { key: 'rent_monthly', label: 'Loyer mensuel (€)', type: 'number' }, { key: 'charges_monthly', label: 'Charges mensuelles (€)', type: 'number' }],
  'crowdlending':   [{ key: 'rate', label: 'Taux (%)', type: 'number' }, { key: 'capital_remaining', label: 'Capital restant (€)', type: 'number' }, { key: 'interests_received', label: 'Intérêts perçus (€)', type: 'number' }],
}

export default function AssetForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [form, setForm] = useState({
    name: '', asset_category_id: '', platform_id: '', currency: 'EUR',
    current_value: '', initial_value: '', acquisition_date: '', status: 'active',
    update_frequency: 'monthly', estimated_yield: '', notes: '', is_liability: false, meta: {} as Record<string, string>,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: categories } = useQuery(['categories'], () => categoriesApi.list())
  const { data: platforms } = useQuery(['platforms'], () => platformsApi.list())

  // Load existing asset for edit
  const { data: existingAsset } = useQuery(
    ['assets', 'edit', Number(id)],
    () => assetsApi.get(Number(id)),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (existingAsset) {
      setForm({
        name: existingAsset.name,
        asset_category_id: String(existingAsset.category?.id ?? ''),
        platform_id: String(existingAsset.platform?.id ?? ''),
        currency: existingAsset.currency,
        current_value: String(existingAsset.current_value),
        initial_value: String(existingAsset.initial_value ?? ''),
        acquisition_date: existingAsset.acquisition_date ?? '',
        status: existingAsset.status,
        update_frequency: existingAsset.update_frequency,
        estimated_yield: String(existingAsset.estimated_yield ?? ''),
        notes: existingAsset.notes ?? '',
        is_liability: existingAsset.is_liability,
        meta: Object.fromEntries(Object.entries(existingAsset.meta ?? {}).map(([k, v]) => [k, String(v)])),
      })
    }
  }, [existingAsset])

  const selectedCategory = categories?.find(c => String(c.id) === form.asset_category_id)
  const metaFields = selectedCategory ? (CATEGORY_META_FIELDS[selectedCategory.slug] ?? []) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      name: form.name,
      asset_category_id: Number(form.asset_category_id),
      platform_id: form.platform_id ? Number(form.platform_id) : null,
      currency: form.currency,
      current_value: parseFloat(form.current_value),
      initial_value: form.initial_value ? parseFloat(form.initial_value) : undefined,
      acquisition_date: form.acquisition_date || undefined,
      status: form.status as 'active' | 'closed' | 'pending',
      update_frequency: form.update_frequency as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'manual',
      estimated_yield: form.estimated_yield ? parseFloat(form.estimated_yield) : undefined,
      notes: form.notes || undefined,
      is_liability: form.is_liability,
      meta: Object.fromEntries(Object.entries(form.meta).filter(([, v]) => v !== '').map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])),
    }

    try {
      if (isEdit) {
        await assetsApi.update(Number(id), payload)
        navigate(`/assets/${id}`)
      } else {
        const asset = await assetsApi.create(payload)
        navigate(`/assets/${asset.id}`)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
  const labelClass = "text-sm font-medium mb-1 block"

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to={isEdit ? `/assets/${id}` : '/assets'} className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">{isEdit ? 'Modifier l\'actif' : 'Nouvel actif'}</h1>
      </div>

      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Type & plateforme</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Catégorie *</label>
              <select value={form.asset_category_id} onChange={e => setForm(f => ({ ...f, asset_category_id: e.target.value, meta: {} }))} required className={inputClass}>
                <option value="">Sélectionner...</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Plateforme</label>
              <select value={form.platform_id} onChange={e => setForm(f => ({ ...f, platform_id: e.target.value }))} className={inputClass}>
                <option value="">Sans plateforme</option>
                {platforms?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_liability" checked={form.is_liability} onChange={e => setForm(f => ({ ...f, is_liability: e.target.checked }))} className="rounded" />
            <label htmlFor="is_liability" className="text-sm">C'est un passif (dette, emprunt)</label>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <h2 className="font-semibold text-sm">Informations générales</h2>
          <div>
            <label className={labelClass}>Nom *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inputClass} placeholder="Ex: Livret A Boursorama" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valeur actuelle ({form.currency}) *</label>
              <input type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} required min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Capital investi ({form.currency})</label>
              <input type="number" value={form.initial_value} onChange={e => setForm(f => ({ ...f, initial_value: e.target.value }))} min="0" step="0.01" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Devise</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputClass}>
                {['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'BTC', 'ETH'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fréquence MAJ</label>
              <select value={form.update_frequency} onChange={e => setForm(f => ({ ...f, update_frequency: e.target.value }))} className={inputClass}>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
                <option value="quarterly">Trimestrielle</option>
                <option value="yearly">Annuelle</option>
                <option value="manual">Manuelle</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date d'acquisition</label>
              <input type="date" value={form.acquisition_date} onChange={e => setForm(f => ({ ...f, acquisition_date: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rendement estimé (%)</label>
              <input type="number" value={form.estimated_yield} onChange={e => setForm(f => ({ ...f, estimated_yield: e.target.value }))} step="0.01" className={inputClass} placeholder="Ex: 5.5" />
            </div>
          </div>
        </div>

        {/* Meta fields */}
        {metaFields.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-5 space-y-4">
            <h2 className="font-semibold text-sm">Informations spécifiques — {selectedCategory?.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              {metaFields.map(field => (
                <div key={field.key}>
                  <label className={labelClass}>{field.label}</label>
                  <input
                    type={field.type}
                    value={form.meta[field.key] ?? ''}
                    onChange={e => setForm(f => ({ ...f, meta: { ...f.meta, [field.key]: e.target.value } }))}
                    placeholder={field.placeholder}
                    step={field.type === 'number' ? '0.01' : undefined}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-card rounded-lg border border-border p-5">
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notes libres..." className={inputClass} />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'actif'}
          </button>
          <Link to={isEdit ? `/assets/${id}` : '/assets'} className="px-5 py-2.5 border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
