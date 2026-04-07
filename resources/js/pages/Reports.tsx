import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import AllocationPieChart from '../components/charts/AllocationPieChart'
import { useQuery } from '../hooks/useQuery'
import { dashboardApi } from '../api/dashboard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { formatCurrency } from '../utils/format'
import ProjectionsSection from './Reports/ProjectionsSection'

export default function Reports() {
  const { data, isLoading } = useQuery(['dashboard'], () => dashboardApi.get())

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <a href="/api/v1/reports/export/csv" className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <a href="/api/v1/reports/export/xlsx" className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors text-green-600 border-green-600/30 hover:bg-green-600/5">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </a>
          <a href="/api/v1/reports/export/pdf" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </a>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Patrimoine net</p>
              <p className="text-xl font-bold">{formatCurrency(data.net_worth)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Total actifs</p>
              <p className="text-xl font-bold">{formatCurrency(data.total_assets)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Total passifs</p>
              <p className="text-xl font-bold">{formatCurrency(data.total_liabilities)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Rendement</p>
              <p className="text-xl font-bold">{data.global_yield.toFixed(2)} %</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card>
              <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
              <AllocationPieChart data={data.allocation_category} />
            </Card>
            <Card>
              <CardHeader><CardTitle>Par plateforme</CardTitle></CardHeader>
              <AllocationPieChart data={data.allocation_platform.map(p => ({ ...p, color: undefined }))} />
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Répartition par catégorie (détail)</CardTitle></CardHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
                  <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase text-right">Valeur</th>
                  <th className="pb-3 text-xs font-medium text-muted-foreground uppercase text-right">Part</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.allocation_category.map(item => (
                  <tr key={item.name} className="hover:bg-muted/30">
                    <td className="py-2.5 pr-4 flex items-center gap-2">
                      {item.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />}
                      {item.name}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium">{formatCurrency(item.value)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.percent} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* Projections */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ProjectionsSection />
      </div>
    </div>
  )
}
