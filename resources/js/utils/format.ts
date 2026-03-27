export function formatCurrency(value: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)} %`
}

export function formatDate(dateStr: string | undefined, locale = 'fr-FR'): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
}

export function formatRelativeDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${diffDays >= 14 ? 's' : ''}`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  return `Il y a ${Math.floor(diffDays / 365)} an${diffDays >= 730 ? 's' : ''}`
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const INCOME_TYPE_LABELS: Record<string, string> = {
  interest: 'Intérêts',
  dividend: 'Dividendes',
  rental: 'Revenus fonciers',
  capital_gain: 'Plus-values',
  scpi: 'Revenus SCPI',
  crowdlending: 'Crowdlending',
  crypto: 'Crypto',
  other: 'Autres',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
  yearly: 'Annuelle',
  manual: 'Manuelle',
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  closed: 'Clôturé',
  pending: 'En attente',
}
