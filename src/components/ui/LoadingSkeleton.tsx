import { cn } from '../../utils/cn'

interface LoadingSkeletonProps {
  className?: string
}

export const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => (
  <div className={cn('animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--theme-accent)_14%,white)]', className)} />
)

export const CardSkeleton = () => (
  <div className="space-y-3">
    <LoadingSkeleton className="h-4 w-2/3" />
    <LoadingSkeleton className="h-3 w-full" />
    <LoadingSkeleton className="h-3 w-5/6" />
  </div>
)
