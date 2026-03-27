import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import { Landmark } from 'lucide-react'

export default function Login() {
  const [email, setEmail]       = useState('demo@patrimoine.local')
  const [password, setPassword] = useState('password')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate                = useNavigate()
  const setUser                 = useAuthStore(s => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authApi.login(email, password)
      setUser(user)
      navigate('/')
    } catch {
      setError('Identifiants invalides. Vérifiez votre email et mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3">
            <Landmark className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">PatrimoineApp</h1>
          <p className="text-sm text-muted-foreground">Gestion de patrimoine personnel</p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="font-semibold text-base mb-5">Connexion</h2>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="email">Email</label>
              <input
                id="email" type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="vous@exemple.fr"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="password">Mot de passe</label>
              <input
                id="password" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Compte démo : demo@patrimoine.local / password
          </p>
        </div>
      </div>
    </div>
  )
}
