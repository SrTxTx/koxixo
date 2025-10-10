'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastItem = {
  id: string
  type: ToastType
  title?: string
  message: string
  timeout?: number
}

type ToastContextValue = {
  show: (opts: { type?: ToastType; message: string; title?: string; timeout?: number }) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((opts: { type?: ToastType; message: string; title?: string; timeout?: number }) => {
    const id = Math.random().toString(36).slice(2)
    const t: ToastItem = {
      id,
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message,
      timeout: opts.timeout ?? 3500,
    }
    setItems((prev) => [t, ...prev].slice(0, 5))
    if (t.timeout && t.timeout > 0) {
      setTimeout(() => remove(id), t.timeout)
    }
  }, [remove])

  const api = useMemo<ToastContextValue>(() => ({
    show,
    success: (message, title) => show({ type: 'success', message, title }),
    error: (message, title) => show({ type: 'error', message, title, timeout: 5000 }),
    info: (message, title) => show({ type: 'info', message, title }),
    warning: (message, title) => show({ type: 'warning', message, title }),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] top-4 right-4 space-y-2 w-[90vw] max-w-sm">
        {items.map((t) => (
          <div key={t.id} role="status" className={`rounded-lg shadow-md border px-4 py-3 text-sm flex items-start gap-2
            ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              : t.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
              : 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'}`}
          >
            <div className="flex-1">
              {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
              <div>{t.message}</div>
            </div>
            <button className="ml-2 text-xs opacity-70 hover:opacity-100" aria-label="Fechar"
              onClick={() => remove(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
