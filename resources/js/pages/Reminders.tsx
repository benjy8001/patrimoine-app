import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { remindersApi } from '../api/reminders'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Card } from '../components/shared/Card'
import { Bell, Plus, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { formatDate } from '../utils/format'
import { cn } from '../utils/cn'
import type { Reminder } from '../types'

const FREQ_LABELS: Record<string, string> = {
  once: 'Une fois', weekly: 'Hebdomadaire', monthly: 'Mensuel',
  quarterly: 'Trimestriel', yearly: 'Annuel',
}

export default function Reminders() {
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', message: '', due_date: '', frequency: 'monthly', asset_id: '' })

  const { data: remindersData, isLoading, refetch } = useQuery(
    ['reminders'],
    () => remindersApi.list()
  )
  const reminders: Reminder[] = remindersData ?? []

  const overdueReminders = reminders.filter((r: Reminder) => r.next_due_at && new Date(r.next_due_at) <= new Date())
  const upcomingReminders = reminders.filter((r: Reminder) => !r.next_due_at || new Date(r.next_due_at) > new Date())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await remindersApi.create({
      title: form.title,
      message: form.message || undefined,
      due_date: form.due_date,
      frequency: form.frequency as Reminder['frequency'],
      is_active: true,
    })
    setShowForm(false)
    setForm({ title: '', message: '', due_date: '', frequency: 'monthly', asset_id: '' })
    refetch()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await remindersApi.delete(deleteId)
    setDeleteId(null)
    refetch()
  }

  const handleToggle = async (reminder: Reminder) => {
    await remindersApi.update(reminder.id, { is_active: !reminder.is_active })
    refetch()
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{reminders.length} rappel{reminders.length > 1 ? 's' : ''} • {overdueReminders.length} en retard</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau rappel
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <h3 className="font-semibold text-sm mb-4">Nouveau rappel</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Titre *</label>
              <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="Ex: Mettre à jour le PEA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date d'échéance *</label>
                <input type="date" required value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fréquence</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className={inputClass}>
                  {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Message (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} className={inputClass} placeholder="Détails du rappel..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Créer</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">Annuler</button>
            </div>
          </form>
        </Card>
      )}

      {/* Overdue */}
      {overdueReminders.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-destructive mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> En retard ({overdueReminders.length})
          </h2>
          <div className="space-y-2">
            {overdueReminders.map((r: Reminder) => (
              <ReminderCard key={r.id} reminder={r} onDelete={() => setDeleteId(r.id)} onToggle={() => handleToggle(r)} overdue />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingReminders.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> À venir ({upcomingReminders.length})
          </h2>
          <div className="space-y-2">
            {upcomingReminders.map((r: Reminder) => (
              <ReminderCard key={r.id} reminder={r} onDelete={() => setDeleteId(r.id)} onToggle={() => handleToggle(r)} />
            ))}
          </div>
        </div>
      )}

      {reminders.length === 0 && (
        <EmptyState icon={Bell} title="Aucun rappel" description="Créez des rappels pour ne pas oublier de mettre à jour vos actifs." />
      )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}
        title="Supprimer ce rappel ?" confirmLabel="Supprimer" destructive onConfirm={handleDelete}
      />
    </div>
  )
}

function ReminderCard({ reminder, onDelete, onToggle, overdue = false }: { reminder: Reminder; onDelete: () => void; onToggle: () => void; overdue?: boolean }) {
  return (
    <div className={cn(
      'bg-card rounded-lg border p-4 flex items-start justify-between',
      overdue ? 'border-destructive/40 bg-destructive/5' : 'border-border'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', overdue ? 'bg-destructive/20' : 'bg-primary/10')}>
          <Bell className={cn('w-4 h-4', overdue ? 'text-destructive' : 'text-primary')} />
        </div>
        <div>
          <p className="font-medium text-sm">{reminder.title}</p>
          {reminder.message && <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">Échéance : {formatDate(reminder.next_due_at ?? reminder.due_date)}</span>
            <span className="text-xs text-muted-foreground">• {FREQ_LABELS[reminder.frequency]}</span>
            {reminder.asset && <span className="text-xs text-primary">{reminder.asset.name}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button onClick={onToggle} className="p-1.5 rounded hover:bg-accent transition-colors" title={reminder.is_active ? 'Désactiver' : 'Activer'}>
          <CheckCircle className={cn('w-4 h-4', reminder.is_active ? 'text-green-500' : 'text-muted-foreground')} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-accent transition-colors text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
