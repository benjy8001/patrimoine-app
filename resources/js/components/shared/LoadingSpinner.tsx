import { cn } from '../../utils/cn'

export default function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-muted border-t-primary', sizes[size])} />
    </div>
  )
}
