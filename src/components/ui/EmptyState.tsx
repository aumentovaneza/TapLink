import { Link } from 'react-router-dom'
import Button from './Button'
import Card from './Card'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

const EmptyState = ({ title, description, actionLabel, actionTo }: EmptyStateProps) => {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_18%,white)] text-[var(--theme-accent)]">
        <span className="text-xl">○</span>
      </div>
      <h3 className="text-xl font-semibold text-[var(--theme-text)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--theme-muted)]">{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="mt-5 inline-block">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </Card>
  )
}

export default EmptyState
