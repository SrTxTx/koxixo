'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'light' | 'dark'

// Preferências locais para decidir se seguimos o sistema ou não
const PREFS_KEY = 'koxixo:preferences:v1'
type Appearance = 'light' | 'dark' | 'system'

function getAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.appearance === 'light' || parsed?.appearance === 'dark' || parsed?.appearance === 'system') {
        return parsed.appearance
      }
    }
  } catch {}
  return 'light'
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Carregar tema do localStorage e/ou seguir sistema quando componente montar
  useEffect(() => {
    const appearance = getAppearance()
    if (appearance === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setThemeState(systemTheme)
    } else {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      setThemeState(savedTheme || (appearance === 'dark' ? 'dark' : 'light'))
    }
    setMounted(true)
  }, [])

  // Reagir dinamicamente às mudanças do SO quando em modo "sistema"
  useEffect(() => {
    if (!mounted) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const appearance = getAppearance()
      if (appearance === 'system') {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }
    // aplicar listener quando preferência for sistema
    if (getAppearance() === 'system') {
      try {
        mql.addEventListener('change', handler)
      } catch {
        // Safari antigo
        // @ts-ignore
        mql.addListener(handler)
      }
    }
    // também observar alterações de preferências vindas de outra aba
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === PREFS_KEY) {
        const appearance = getAppearance()
        if (appearance === 'system') {
          setThemeState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        } else {
          setThemeState(appearance === 'dark' ? 'dark' : 'light')
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      try {
        mql.removeEventListener('change', handler)
      } catch {
        // @ts-ignore
        mql.removeListener(handler)
      }
      window.removeEventListener('storage', onStorage)
    }
  }, [mounted])

  // Aplicar tema ao DOM
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      // Se a preferência for sistema, não persistir 'theme', pois acompanhamos o SO
      if (getAppearance() !== 'system') {
        localStorage.setItem('theme', theme)
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  // Sempre prover o contexto para evitar erro em consumidores antes do mount
  // Durante a hidratação inicial, podemos esconder conteúdo para evitar flicker
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={mounted ? undefined : 'opacity-0'}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}