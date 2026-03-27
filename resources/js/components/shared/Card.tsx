import { cn } from '../../utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={cn(
      'bg-card rounded-lg border border-border shadow-sm',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-5',
      padding === 'lg' && 'p-6',
      className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-semibold text-sm text-muted-foreground uppercase tracking-wide', className)}>{children}</h3>
}
