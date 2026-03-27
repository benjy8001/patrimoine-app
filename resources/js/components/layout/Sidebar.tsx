import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'
import {
  LayoutDashboard, Package, CreditCard, History, TrendingUp,
  Bell, FileText, Scale, Settings, ChevronRight, Landmark, Building2
} from 'lucide-react'
import { useQuery } from '../../hooks/useQuery'
import { remindersApi } from '../../api/reminders'

const navItems = [
  { to: '/',           label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/assets',     label: 'Mes actifs',      icon: Package },
  { to: '/platforms',  label: 'Plateformes',     icon: Building2 },
  { to: '/liabilities',label: 'Passifs/Crédits', icon: CreditCard },
  { to: '/history',    label: 'Historique',       icon: History },
  { to: '/income',     label: 'Revenus',          icon: TrendingUp },
  { to: '/reminders',  label: 'Rappels',          icon: Bell, badge: true },
  { to: '/tax',        label: 'Fiscalité',        icon: Scale },
  { to: '/reports',    label: 'Rapports',         icon: FileText },
  { to: '/settings',   label: 'Paramètres',       icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { data: reminders } = useQuery(['reminders', 'due'], () =>
    remindersApi.list({ active: true })
  )

  const overdueCount = reminders?.filter(r => {
    if (!r.next_due_at) return false
    return new Date(r.next_due_at) <= new Date()
  }).length ?? 0

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Landmark className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">PatrimoineApp</p>
            <p className="text-xs text-muted-foreground">Gestion patrimoniale</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && overdueCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          PatrimoineApp v1.0
        </p>
      </div>
    </aside>
  )
}
