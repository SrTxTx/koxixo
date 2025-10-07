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
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50"
        disabled
        title="Carregando tema..."
        aria-label="Carregando tema..."
      >
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
      className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  )
}