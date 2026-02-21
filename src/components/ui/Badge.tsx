import { cn } from '../../utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[color-mix(in_srgb,var(--theme-accent)_24%,transparent)] text-[var(--theme-accent)]',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
}

const Badge = ({ children, className, variant = 'default' }: BadgeProps) => {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 text-xs font-semibold', variantStyles[variant], className)}
      style={{ borderRadius: '999px' }}
    >
      {children}
    </span>
  )
}

export default Badge
