import { CSSProperties } from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  hoverable?: boolean
  compact?: boolean
  style?: CSSProperties
}

const Card = ({ className, children, hoverable = false, compact = false, style }: CardProps) => {
  return (
    <div
      className={cn(
        'border transition-all duration-200 backdrop-blur-sm',
        compact ? 'p-4' : 'p-6',
        hoverable ? 'hover:-translate-y-1' : '',
        className,
      )}
      style={{
        background: 'var(--theme-card)',
        border: 'var(--theme-card-border)',
        borderRadius: 'var(--theme-radius)',
        boxShadow: 'var(--theme-shadow)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default Card
