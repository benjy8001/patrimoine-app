import { Card } from '../shared/Card'
import CurrencyDisplay from '../shared/CurrencyDisplay'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { DashboardData } from '../../types'
import { formatPercent } from '../../utils/format'

interface NetWorthCardProps {
  data: DashboardData
}

export default function NetWorthCard({ data }: NetWorthCardProps) {
  const { net_worth, total_assets, total_liabilities, monthly_variation, yearly_variation } = data
  const monthUp = monthly_variation.diff >= 0
  const yearUp = yearly_variation.diff >= 0

  return (
    <Card className="col-span-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Net Worth */}
        <div className="sm:col-span-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Patrimoine net</p>
          <CurrencyDisplay value={net_worth} size="xl" />
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs">
              {monthUp ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={monthUp ? 'text-green-600' : 'text-red-500'}>
                {formatPercent(monthly_variation.percent)} ce mois
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {yearUp ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
              <span className={yearUp ? 'text-green-600' : 'text-red-500'}>
                {formatPercent(yearly_variation.percent)} cette année
              </span>
            </div>
          </div>
        </div>

        {/* Total Assets */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total actifs</p>
          <CurrencyDisplay value={total_assets} size="lg" />
          <p className="text-xs text-muted-foreground mt-1">Investissement initial : <CurrencyDisplay value={data.initial_invested} size="sm" /></p>
        </div>

        {/* Total Liabilities */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total passifs</p>
          <CurrencyDisplay value={total_liabilities} size="lg" colorize />
          <p className="text-xs text-muted-foreground mt-1">
            Rendement global : <span className="font-medium">{data.global_yield.toFixed(2)} %</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
