import { createContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getStoredTheme, persistTheme, scopeFromPathname, themes, ThemeName } from './themes'

interface ThemeContextValue {
  theme: ThemeName
  activeScope: string
  setTheme: (theme: ThemeName) => void
  setThemeForScope: (scope: string, theme: ThemeName) => void
  allThemes: typeof themes
}

const DEFAULT_THEME: ThemeName = 'minimal'

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const applyThemeToRoot = (theme: ThemeName) => {
  const selectedTheme = themes[theme]
  const root = document.documentElement

  root.setAttribute('data-theme', theme)
  root.style.setProperty('--theme-background', selectedTheme.background)
  root.style.setProperty('--theme-text', selectedTheme.text)
  root.style.setProperty('--theme-muted', selectedTheme.mutedText)
  root.style.setProperty('--theme-accent', selectedTheme.accent)
  root.style.setProperty('--theme-card', selectedTheme.cardBackground)
  root.style.setProperty('--theme-card-border', selectedTheme.cardBorder)
  root.style.setProperty('--theme-button-bg', selectedTheme.buttonBackground)
  root.style.setProperty('--theme-button-hover', selectedTheme.buttonHover)
  root.style.setProperty('--theme-button-text', selectedTheme.buttonText)
  root.style.setProperty('--theme-radius', selectedTheme.borderRadius)
  root.style.setProperty('--theme-shadow', selectedTheme.shadow)
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const currentScope = useMemo(() => scopeFromPathname(location.pathname), [location.pathname])

  const [theme, setThemeState] = useState<ThemeName>(() => {
    const storedTheme = getStoredTheme(currentScope)
    return storedTheme ?? DEFAULT_THEME
  })

  useEffect(() => {
    const storedTheme = getStoredTheme(currentScope)
    setThemeState(storedTheme ?? DEFAULT_THEME)
  }, [currentScope])

  useEffect(() => {
    applyThemeToRoot(theme)
  }, [theme])

  const setTheme = (selectedTheme: ThemeName) => {
    setThemeState(selectedTheme)
    persistTheme(currentScope, selectedTheme)
  }

  const setThemeForScope = (scope: string, selectedTheme: ThemeName) => {
    persistTheme(scope, selectedTheme)
    if (scope === currentScope) {
      setThemeState(selectedTheme)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeScope: currentScope,
        setTheme,
        setThemeForScope,
        allThemes: themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
