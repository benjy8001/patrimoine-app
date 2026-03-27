import { useDashboard, useMonthlyChart } from '../hooks/useDashboard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import NetWorthCard from '../components/dashboard/NetWorthCard'
import AllocationPieChart from '../components/charts/AllocationPieChart'
import EvolutionLineChart from '../components/charts/EvolutionLineChart'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import CurrencyDisplay from '../components/shared/CurrencyDisplay'
import { Link } from 'react-router-dom'
import { AlertCircle, Bell, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../utils/format'

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard()
  const { data: monthlyData } = useMonthlyChart()

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />
  if (error || !data) return <p className="text-destructive text-sm text-center mt-10">Erreur de chargement des données.</p>

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Net Worth */}
      <NetWorthCard data={data} />

      {/* Alert banners */}
      {data.overdue_assets > 0 && (
        <Link to="/reminders" className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span><strong>{data.overdue_assets} actif{data.overdue_assets > 1 ? 's' : ''}</strong> {data.overdue_assets > 1 ? 'nécessitent' : 'nécessite'} une mise à jour de valorisation.</span>
        </Link>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Evolution Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Évolution du patrimoine</CardTitle>
            <span className="text-xs text-muted-foreground">12 derniers mois</span>
          </CardHeader>
          {monthlyData ? (
            <EvolutionLineChart data={monthlyData} />
          ) : <LoadingSpinner className="h-[260px]" />}
        </Card>

        {/* Allocation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
          </CardHeader>
          <AllocationPieChart data={data.allocation_category} />
        </Card>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Revenus {new Date().getFullYear()}</p>
          <CurrencyDisplay value={data.income_current_year} size="lg" />
          <p className="text-xs text-muted-foreground mt-1">Exercice en cours</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rendement global</p>
          <p className="text-xl font-bold">{data.global_yield.toFixed(2)} %</p>
          <p className="text-xs text-muted-foreground mt-1">Sur capital investi</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Actifs en retard</p>
          <p className={`text-xl font-bold ${data.overdue_assets > 0 ? 'text-orange-500' : 'text-foreground'}`}>
            {data.overdue_assets}
          </p>
          <Link to="/reminders" className="text-xs text-primary hover:underline mt-1 block">Voir les rappels</Link>
        </Card>
        <Card>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Devises</p>
          <p className="text-xl font-bold">{data.allocation_currency.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.allocation_currency.map(c => c.currency).join(', ')}
          </p>
        </Card>
      </div>

      {/* Allocation by Platform */}
      {data.allocation_platform.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Répartition par plateforme</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {data.allocation_platform.slice(0, 8).map(item => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-sm w-40 truncate">{item.name}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="text-sm font-medium w-16 text-right">{item.percent}%</span>
                <span className="text-xs text-muted-foreground w-24 text-right">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
