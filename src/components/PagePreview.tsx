import { cn } from '../utils/cn'

interface PagePreviewProps {
  children: React.ReactNode
  className?: string
}

const PagePreview = ({ children, className }: PagePreviewProps) => {
  return (
    <div className={cn('mx-auto max-w-[320px] rounded-[2.2rem] border p-3', className)} style={{ borderColor: 'color-mix(in srgb, var(--theme-accent) 35%, transparent)' }}>
      <div
        className="rounded-[1.8rem] border p-3"
        style={{
          background: 'color-mix(in srgb, var(--theme-card) 90%, white)',
          borderColor: 'color-mix(in srgb, var(--theme-accent) 22%, transparent)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default PagePreview
