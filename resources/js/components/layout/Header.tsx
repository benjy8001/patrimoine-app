import { useAuthStore } from '../../stores/authStore'
import { useLocation } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/assets': 'Mes actifs',
  '/assets/new': 'Nouvel actif',
  '/liabilities': 'Passifs & Crédits',
  '/history': 'Historique des valorisations',
  '/income': 'Revenus',
  '/reminders': 'Rappels',
  '/tax': 'Fiscalité',
  '/reports': 'Rapports',
  '/settings': 'Paramètres',
}

export default function Header() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] ?? 'PatrimoineApp'

  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
      <h1 className="font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
