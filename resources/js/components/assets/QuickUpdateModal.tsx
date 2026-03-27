import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { Asset } from '../../types'
import { assetsApi } from '../../api/assets'
import { formatCurrency } from '../../utils/format'

interface QuickUpdateModalProps {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (asset: Asset) => void
}

export default function QuickUpdateModal({ asset, open, onOpenChange, onUpdated }: QuickUpdateModalProps) {
  const [value, setValue] = useState(String(asset.current_value))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updated = await assetsApi.update(asset.id, {
        current_value: parseFloat(value),
        last_updated_at: new Date().toISOString(),
      })
      onUpdated(updated)
      onOpenChange(false)
    } catch {
      alert('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card rounded-lg border border-border shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-semibold">{asset.name}</Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></Dialog.Close>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Valeur actuelle : <strong>{formatCurrency(asset.current_value, asset.currency)}</strong>
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nouvelle valeur ({asset.currency})</label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                step="0.01"
                min="0"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Note (optionnel)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex : relevé mensuel"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
