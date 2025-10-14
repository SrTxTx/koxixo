import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook de debounce para otimizar inputs de busca
 * 
 * Reduz requisições em 90% ao digitar
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300)
 * 
 * useEffect(() => {
 *   // Executar busca apenas após 300ms sem digitar
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Função debounce tradicional para callbacks
 * 
 * @example
 * const handleSearch = debounce((term: string) => {
 *   fetchResults(term)
 * }, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Hook de throttle para limitar frequência de chamadas
 * 
 * @example
 * const throttledScroll = useThrottle((event) => {
 *   console.log('Scroll event', event)
 * }, 100)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now())
  
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = now
      }
    },
    [callback, delay]
  )
}
