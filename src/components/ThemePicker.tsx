import { useTheme } from '../theme/useTheme'
import { ThemeName } from '../theme/themes'
import { cn } from '../utils/cn'

interface ThemePickerProps {
  className?: string
  compact?: boolean
}

const ThemePicker = ({ className, compact = false }: ThemePickerProps) => {
  const { allThemes, theme, setTheme } = useTheme()

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted)]">Theme</p>
        <h3 className="text-lg font-semibold text-[var(--theme-text)]">Customize look and feel</h3>
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-3')}>
        {(Object.keys(allThemes) as ThemeName[]).map((themeName) => {
          const item = allThemes[themeName]
          const isActive = theme === themeName

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setTheme(themeName)}
              className={cn(
                'group rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5',
                isActive
                  ? 'border-[var(--theme-accent)] bg-[color-mix(in_srgb,var(--theme-accent)_14%,white)]'
                  : 'border-white/40 bg-white/45 hover:border-[var(--theme-accent)]/40',
              )}
              style={{ boxShadow: isActive ? 'var(--theme-shadow)' : 'none' }}
            >
              <div
                className="mb-2 h-9 rounded-xl border"
                style={{
                  background: item.background,
                  border: item.cardBorder,
                }}
              />
              <p className="text-sm font-semibold text-[var(--theme-text)]">{item.label}</p>
              <p className="text-xs text-[var(--theme-muted)]">{item.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemePicker
