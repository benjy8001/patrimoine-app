import { useState } from 'react'
import { useQuery } from '../hooks/useQuery'
import { taxApi } from '../api/tax'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import { Card, CardHeader, CardTitle } from '../components/shared/Card'
import { AlertTriangle, FileText, Download, RefreshCw } from 'lucide-react'
import { formatCurrency, INCOME_TYPE_LABELS } from '../utils/format'
import type { TaxReport } from '../types'

const DISCLAIMER = "⚠️ Cet outil est une aide à la préparation de votre déclaration fiscale. Il ne remplace pas les conseils d'un expert-comptable ou fiscaliste agréé. Vérifiez toujours les montants avec vos relevés officiels et documents fiscaux."

export default function Tax() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear - 1)
  const [generating, setGenerating] = useState(false)

  const { data: reportsData, isLoading, refetch } = useQuery(['tax-reports'], () => taxApi.list())
  const reports: TaxReport[] = reportsData ?? []

  const currentReport = reports.find((r: TaxReport) => r.fiscal_year === selectedYear)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await taxApi.generate(selectedYear)
      refetch()
    } catch (e) {
      alert('Erreur lors de la génération.')
    } finally {
      setGenerating(false)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i)
  const summary = currentReport?.data?.summary
  const taxLines = currentReport?.data?.tax_lines ?? []

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">{DISCLAIMER}</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Année fiscale :</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {currentReport ? 'Régénérer' : 'Générer le rapport'}
          </button>
          {currentReport && (
            <>
              <a href={taxApi.exportCsvUrl(currentReport.id)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
                <Download className="w-3.5 h-3.5" /> CSV
              </a>
              <a href={taxApi.exportPdfUrl(currentReport.id)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">
                <FileText className="w-3.5 h-3.5" /> PDF
              </a>
            </>
          )}
        </div>
      </div>

      {!currentReport ? (
        <Card>
          <div className="py-10 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Aucun rapport pour {selectedYear}</p>
            <p className="text-xs text-muted-foreground mb-4">Générez le rapport fiscal pour voir les montants à reporter.</p>
            <button onClick={handleGenerate} disabled={generating} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              Générer le rapport {selectedYear}
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Total revenus {selectedYear}</p>
              <p className="text-xl font-bold">{formatCurrency(summary?.total_income ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Revenus imposables</p>
              <p className="text-xl font-bold">{formatCurrency(summary?.total_taxable ?? 0)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground mb-1">Généré le</p>
              <p className="text-sm font-medium">
                {currentReport.generated_at
                  ? new Date(currentReport.generated_at).toLocaleDateString('fr-FR')
                  : '—'}
              </p>
              <span className="text-xs text-muted-foreground capitalize">{currentReport.status}</span>
            </Card>
          </div>

          {/* Tax lines */}
          <Card>
            <CardHeader>
              <CardTitle>Montants à reporter — Déclaration {selectedYear}</CardTitle>
            </CardHeader>
            {taxLines.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun revenu imposable trouvé pour {selectedYear}.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Case</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="pb-3 text-xs font-medium text-muted-foreground uppercase text-right">Montant (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxLines.map((line, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="py-3 pr-4"><span className="font-mono font-semibold text-primary text-sm">{line.box}</span></td>
                      <td className="py-3 pr-4">
                        <p>{line.label}</p>
                        {line.note && <p className="text-xs text-muted-foreground mt-0.5">{line.note}</p>}
                      </td>
                      <td className="py-3 text-right font-semibold">{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* By type breakdown */}
          {summary?.by_type && (
            <Card>
              <CardHeader><CardTitle>Détail par type de revenu</CardTitle></CardHeader>
              <div className="space-y-3">
                {Object.entries(summary.by_type).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{INCOME_TYPE_LABELS[type] ?? type}</p>
                      <p className="text-xs text-muted-foreground">{data.count} entrée{data.count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(data.total)}</p>
                      {data.non_taxable > 0 && <p className="text-xs text-muted-foreground">Dont non imposable : {formatCurrency(data.non_taxable)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
