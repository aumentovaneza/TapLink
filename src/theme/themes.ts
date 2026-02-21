export type ThemeName =
  | 'minimal'
  | 'dark'
  | 'neon'
  | 'pastel'
  | 'glass'
  | 'warm'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'royal'
  | 'candy'

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
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    description: 'Cool, aquatic tones',
    background: 'linear-gradient(160deg, #dbeafe 0%, #cffafe 46%, #e0f2fe 100%)',
    text: '#0c4a6e',
    mutedText: '#0369a1',
    accent: '#0284c7',
    cardBackground: 'rgba(240, 249, 255, 0.86)',
    cardBorder: '1px solid rgba(2, 132, 199, 0.22)',
    buttonBackground: '#0284c7',
    buttonHover: '#0369a1',
    buttonText: '#f0f9ff',
    borderRadius: '1.3rem',
    shadow: '0 14px 35px -20px rgba(2, 132, 199, 0.45)',
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    description: 'Natural and grounded',
    background: 'linear-gradient(155deg, #ecfdf5 0%, #d1fae5 44%, #f0fdf4 100%)',
    text: '#14532d',
    mutedText: '#166534',
    accent: '#16a34a',
    cardBackground: 'rgba(240, 253, 244, 0.88)',
    cardBorder: '1px solid rgba(22, 163, 74, 0.24)',
    buttonBackground: '#16a34a',
    buttonHover: '#15803d',
    buttonText: '#f0fdf4',
    borderRadius: '1.2rem',
    shadow: '0 14px 35px -20px rgba(22, 163, 74, 0.45)',
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    description: 'Golden hour warmth',
    background: 'linear-gradient(145deg, #fff7ed 0%, #fee2e2 48%, #ffedd5 100%)',
    text: '#7c2d12',
    mutedText: '#9a3412',
    accent: '#f97316',
    cardBackground: 'rgba(255, 247, 237, 0.86)',
    cardBorder: '1px solid rgba(249, 115, 22, 0.24)',
    buttonBackground: '#f97316',
    buttonHover: '#ea580c',
    buttonText: '#fff7ed',
    borderRadius: '1.4rem',
    shadow: '0 16px 35px -20px rgba(249, 115, 22, 0.45)',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    description: 'Deep, elegant contrast',
    background: 'radial-gradient(circle at 30% -10%, #1e1b4b 0%, #020617 60%, #000000 100%)',
    text: '#e0e7ff',
    mutedText: '#a5b4fc',
    accent: '#818cf8',
    cardBackground: 'rgba(15, 23, 42, 0.8)',
    cardBorder: '1px solid rgba(129, 140, 248, 0.28)',
    buttonBackground: '#6366f1',
    buttonHover: '#4f46e5',
    buttonText: '#eef2ff',
    borderRadius: '1.25rem',
    shadow: '0 18px 40px -18px rgba(79, 70, 229, 0.6)',
  },
  royal: {
    name: 'royal',
    label: 'Royal',
    description: 'Refined and premium',
    background: 'linear-gradient(150deg, #f5f3ff 0%, #ede9fe 45%, #fdf4ff 100%)',
    text: '#312e81',
    mutedText: '#5b21b6',
    accent: '#7c3aed',
    cardBackground: 'rgba(250, 245, 255, 0.88)',
    cardBorder: '1px solid rgba(124, 58, 237, 0.24)',
    buttonBackground: '#7c3aed',
    buttonHover: '#6d28d9',
    buttonText: '#faf5ff',
    borderRadius: '1.35rem',
    shadow: '0 16px 36px -20px rgba(124, 58, 237, 0.45)',
  },
  candy: {
    name: 'candy',
    label: 'Candy',
    description: 'Bright and playful',
    background: 'linear-gradient(140deg, #fdf2f8 0%, #e0f2fe 45%, #fef9c3 100%)',
    text: '#831843',
    mutedText: '#be185d',
    accent: '#ec4899',
    cardBackground: 'rgba(255, 255, 255, 0.84)',
    cardBorder: '1px solid rgba(236, 72, 153, 0.3)',
    buttonBackground: '#ec4899',
    buttonHover: '#db2777',
    buttonText: '#fff1f2',
    borderRadius: '1.5rem',
    shadow: '0 16px 36px -20px rgba(236, 72, 153, 0.45)',
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
