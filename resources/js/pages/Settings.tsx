import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import api from '../api/axios'

export default function Settings() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', currency: 'EUR', locale: 'fr', timezone: 'Europe/Paris' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, currency: user.currency, locale: user.locale, timezone: user.timezone })
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSaved(false)
    try {
      const res = await api.put('/settings', form)
      setUser(res.data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors de la sauvegarde.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
  const labelClass = "text-sm font-medium mb-1 block"

  return (
    <div className="max-w-lg space-y-5 animate-fade-in">
      {error && <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">{error}</div>}
      {saved && <div className="bg-green-50 text-green-700 text-sm rounded-md p-3">Paramètres enregistrés avec succès.</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Nom</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Préférences</CardTitle></CardHeader>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Devise par défaut</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputClass}>
                {['EUR', 'USD', 'GBP', 'CHF', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Langue</label>
              <select value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))} className={inputClass}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fuseau horaire</label>
              <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className={inputClass}>
                <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </Card>

        <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
        </button>
      </form>

      <Card padding="sm">
        <p className="text-xs text-muted-foreground text-center">
          PatrimoineApp — Application de gestion de patrimoine personnel.<br />
          Version 1.0 MVP — Données stockées localement.
        </p>
      </Card>
    </div>
  )
}
