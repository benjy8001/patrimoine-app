import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { platformsApi } from '../api/platforms'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import { Building2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { Platform } from '../types'

const PLATFORM_TYPE_LABELS: Record<string, string> = {
  bank: 'Banque',
  broker: 'Courtier',
  insurance: 'Assurance',
  crowdfunding: 'Crowdfunding',
  crypto: 'Crypto',
  other: 'Autre',
}

const emptyForm = { name: '', type: '', website: '', notes: '', is_active: true }

export default function Platforms() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const { data: platforms, isLoading, refetch } = useQuery(['platforms'], () => platformsApi.list())

  const totalAssets = platforms?.reduce((s, p) => s + (p.assets_count ?? 0), 0) ?? 0
  const activeCount = platforms?.filter(p => p.is_active).length ?? 0

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (platform: Platform) => {
    setEditingId(platform.id)
    setForm({
      name: platform.name,
      type: platform.type ?? '',
      website: platform.website ?? '',
      notes: platform.notes ?? '',
      is_active: platform.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, type: form.type || null, website: form.website || null, notes: form.notes || null }
    if (editingId) {
      await platformsApi.update(editingId, payload)
    } else {
      await platformsApi.create(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    refetch()
  }

  const handleDelete = async () => {
    if (deleteId) { await platformsApi.delete(deleteId); setDeleteId(null); refetch() }
  }

  const inputClass = 'w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring'

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Plateformes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Total plateformes</p>
          <p className="text-xl font-bold">{platforms?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Actives</p>
          <p className="text-xl font-bold">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground mb-1">Actifs liés</p>
          <p className="text-xl font-bold">{totalAssets}</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <h3 className="font-semibold text-sm mb-4">{editingId ? 'Modifier la plateforme' : 'Nouvelle plateforme'}</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Ex: Boursorama" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                  <option value="">— Sélectionner —</option>
                  {Object.entries(PLATFORM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Site web</label>
              <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className={inputClass} placeholder="https://" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="is_active" className="text-sm">Plateforme active</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                {editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Liste des plateformes</CardTitle></CardHeader>
        {!platforms?.length ? (
          <EmptyState icon={Building2} title="Aucune plateforme" description="Ajoutez vos banques, courtiers et autres plateformes pour les associer à vos actifs." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Nom</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Site</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase text-right">Actifs</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {platforms.map((p: Platform) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-4 font-medium">{p.name}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{p.type ? (PLATFORM_TYPE_LABELS[p.type] ?? p.type) : '—'}</td>
                    <td className="py-2.5 pr-4">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                          <ExternalLink className="w-3 h-3" /> Lien
                        </a>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-right">{p.assets_count ?? 0}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1 rounded hover:bg-accent transition-colors text-destructive" disabled={!!p.assets_count}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={o => !o && setDeleteId(null)}
        title="Supprimer cette plateforme ?"
        confirmLabel="Supprimer"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
