export type ThemeName = 'minimal' | 'dark' | 'neon' | 'pastel' | 'glass' | 'warm'

export interface ThemeDefinition {
  name: ThemeName
  label: string
  description: string
  background: string
  text: string
  mutedText: string
  accent: string
  cardBackground: string
  cardBorder: string
  buttonBackground: string
  buttonHover: string
  buttonText: string
  borderRadius: string
  shadow: string
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  minimal: {
    name: 'minimal',
    label: 'Minimal',
    description: 'Neutral and clean',
    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    text: '#0f172a',
    mutedText: '#475569',
    accent: '#2563eb',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    cardBorder: '1px solid rgba(148, 163, 184, 0.28)',
    buttonBackground: '#2563eb',
    buttonHover: '#1d4ed8',
    buttonText: '#ffffff',
    borderRadius: '1.25rem',
    shadow: '0 14px 40px -22px rgba(15, 23, 42, 0.45)',
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    description: 'High contrast and sleek',
    background: 'radial-gradient(circle at 30% 0%, #1f2937 0%, #020617 62%)',
    text: '#e2e8f0',
    mutedText: '#94a3b8',
    accent: '#38bdf8',
    cardBackground: 'rgba(15, 23, 42, 0.82)',
    cardBorder: '1px solid rgba(148, 163, 184, 0.24)',
    buttonBackground: '#0ea5e9',
    buttonHover: '#0284c7',
    buttonText: '#082f49',
    borderRadius: '1.25rem',
    shadow: '0 16px 40px -18px rgba(2, 6, 23, 0.8)',
  },
  neon: {
    name: 'neon',
    label: 'Neon',
    description: 'Vibrant cyber glow',
    background: 'radial-gradient(circle at 0% 0%, #1f1147 0%, #090119 52%, #020617 100%)',
    text: '#f5f3ff',
    mutedText: '#c4b5fd',
    accent: '#22d3ee',
    cardBackground: 'rgba(14, 9, 36, 0.82)',
    cardBorder: '1px solid rgba(45, 212, 191, 0.4)',
    buttonBackground: '#06b6d4',
    buttonHover: '#0891b2',
    buttonText: '#052e2b',
    borderRadius: '1.4rem',
    shadow: '0 0 0 1px rgba(34, 211, 238, 0.45), 0 18px 42px -16px rgba(34, 211, 238, 0.45)',
  },
  pastel: {
    name: 'pastel',
    label: 'Pastel',
    description: 'Soft and playful',
    background: 'linear-gradient(135deg, #fdf2f8 0%, #ecfeff 45%, #fef9c3 100%)',
    text: '#3f3f46',
    mutedText: '#71717a',
    accent: '#ec4899',
    cardBackground: 'rgba(255, 255, 255, 0.8)',
    cardBorder: '1px solid rgba(236, 72, 153, 0.22)',
    buttonBackground: '#ec4899',
    buttonHover: '#db2777',
    buttonText: '#ffffff',
    borderRadius: '1.5rem',
    shadow: '0 14px 35px -18px rgba(236, 72, 153, 0.35)',
  },
  glass: {
    name: 'glass',
    label: 'Glass',
    description: 'Glossy translucent cards',
    background: 'linear-gradient(140deg, #dbeafe 0%, #f5f3ff 52%, #ccfbf1 100%)',
    text: '#0f172a',
    mutedText: '#334155',
    accent: '#6366f1',
    cardBackground: 'rgba(255, 255, 255, 0.42)',
    cardBorder: '1px solid rgba(255, 255, 255, 0.55)',
    buttonBackground: '#4f46e5',
    buttonHover: '#4338ca',
    buttonText: '#eef2ff',
    borderRadius: '1.35rem',
    shadow: '0 10px 30px -18px rgba(79, 70, 229, 0.45)',
  },
  warm: {
    name: 'warm',
    label: 'Warm',
    description: 'Earthy and cozy',
    background: 'linear-gradient(160deg, #fff7ed 0%, #fef3c7 58%, #fed7aa 100%)',
    text: '#431407',
    mutedText: '#9a3412',
    accent: '#ea580c',
    cardBackground: 'rgba(255, 251, 235, 0.9)',
    cardBorder: '1px solid rgba(249, 115, 22, 0.26)',
    buttonBackground: '#ea580c',
    buttonHover: '#c2410c',
    buttonText: '#fffbeb',
    borderRadius: '1.15rem',
    shadow: '0 14px 35px -20px rgba(194, 65, 12, 0.5)',
  },
}

const STORAGE_PREFIX = 'taplink_theme_scope:'

export const getThemeStorageKey = (scope: string): string => `${STORAGE_PREFIX}${scope}`

export const getStoredTheme = (scope: string): ThemeName | null => {
  const raw = localStorage.getItem(getThemeStorageKey(scope))
  if (!raw) {
    return null
  }

  return raw in themes ? (raw as ThemeName) : null
}

export const persistTheme = (scope: string, theme: ThemeName): void => {
  localStorage.setItem(getThemeStorageKey(scope), theme)
}

export const setThemeForTagAndPublic = (theme: ThemeName, tagId: string, publicId: string): void => {
  persistTheme(`tag:${tagId}`, theme)
  persistTheme(`public:${publicId}`, theme)
}

export const scopeFromPathname = (pathname: string): string => {
  const publicMatch = pathname.match(/^\/p\/([^/]+)/)
  if (publicMatch) {
    return `public:${publicMatch[1]}`
  }

  const tagMatch = pathname.match(/^\/t\/([^/]+)/)
  if (tagMatch) {
    return `tag:${tagMatch[1]}`
  }

  const editorMatch = pathname.match(/^\/editor\/([^/]+)/)
  if (editorMatch) {
    return `editor:${editorMatch[1]}`
  }

  if (pathname === '/') {
    return 'page:home'
  }

  return `page:${pathname}`
}
