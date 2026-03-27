import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/format'

interface CurrencyDisplayProps {
  value: number
  currency?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSign?: boolean
  colorize?: boolean
  className?: string
}

export default function CurrencyDisplay({
  value, currency = 'EUR', size = 'md', showSign = false, colorize = false, className,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(Math.abs(value), currency)
  const sign = showSign ? (value >= 0 ? '+' : '−') : value < 0 ? '−' : ''

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base font-medium',
    lg: 'text-xl font-semibold',
    xl: 'text-3xl font-bold',
  }

  const colorClass = colorize
    ? value > 0 ? 'text-green-600 dark:text-green-400' : value < 0 ? 'text-red-500' : 'text-muted-foreground'
    : ''

  return (
    <span className={cn(sizeClasses[size], colorClass, className)}>
      {sign}{formatted}
    </span>
  )
}
