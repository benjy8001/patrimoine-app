import { cn } from '../../utils/cn'

const variants = {
  active:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  asset:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  liability: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

interface StatusBadgeProps {
  variant: keyof typeof variants
  label?: string
  className?: string
}

const defaultLabels: Record<keyof typeof variants, string> = {
  active: 'Actif', closed: 'Clôturé', pending: 'En attente',
  overdue: 'En retard', asset: 'Actif', liability: 'Passif',
}

export default function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {label ?? defaultLabels[variant]}
    </span>
  )
}
