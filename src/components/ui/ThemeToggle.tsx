'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  
  // Garante que o componente só renderiza após montar no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Durante SSR ou antes de montar, renderiza um estado neutro
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-300 bg-gray-100 transition-all duration-200 shadow-lg opacity-75"
        disabled
        title="Carregando tema..."
        aria-label="Carregando tema..."
        style={{ zIndex: 9999 }}
      >
        <Moon className="h-6 w-6 text-gray-500 animate-pulse" />
      </button>
    )
  }

  return <ThemeToggleClient />
}

function ThemeToggleClient() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      style={{ zIndex: 9999 }}
    >
      {theme === 'light' ? (
        <Moon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
      )}
    </button>
  )
}