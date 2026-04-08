import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ExpenseCategory } from '../../types/budget'

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExpenseCategory[]
  defaultDate: string  // format YYYY-MM-DD
  onSubmit: (data: {
    expense_category_id: number
    amount: number
    currency: string
    description: string
    date: string
    notes?: string
  }) => Promise<void>
}

export default function ExpenseForm({ open, onOpenChange, categories, defaultDate, onSubmit }: ExpenseFormProps) {
  const [form, setForm] = useState({
    expense_category_id: categories[0]?.id ?? 0,
    amount:              '',
    currency:            'EUR',
    description:         '',
    date:                defaultDate,
    notes:               '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.description || !form.expense_category_id) {
      setError('Montant, description et catégorie sont requis.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        amount: parseFloat(form.amount),
        notes: form.notes || undefined,
      })
      setForm({ ...form, amount: '', description: '', notes: '' })
      onOpenChange(false)
    } catch {
      setError("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-lg border border-border shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-semibold">Ajouter une dépense</Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-accent">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div>
              <label className="text-sm font-medium mb-1 block">Catégorie</label>
              <select
                value={form.expense_category_id}
                onChange={e => setForm({ ...form, expense_category_id: Number(e.target.value) })}
                className={inputClass}
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Montant</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Devise</label>
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                  className={inputClass}
                >
                  {['EUR', 'USD', 'GBP', 'CHF'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                maxLength={255}
                placeholder="Ex : Courses Carrefour"
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Ajouter la dépense'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
