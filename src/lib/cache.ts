/**
 * Sistema de cache em memória simples
 * Para ambientes serverless - cache por request/instância
 * 
 * Para produção: considere Redis ou Memcached
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Limpar cache expirado a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Obter valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    const isExpired = now - entry.timestamp > entry.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Salvar valor no cache
   * @param key - Chave única
   * @param data - Dados a cachear
   * @param ttl - Time to live em milissegundos (padrão: 5min)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Deletar entrada específica
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidar cache por padrão
   * @example invalidatePattern('orders:*')
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$')
    
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remover entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      const isExpired = now - entry.timestamp > entry.ttl
      if (isExpired) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Obter estatísticas do cache
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Destruir cache e cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Singleton global
const cache = new MemoryCache()

export { cache }

/**
 * Helper para cachear resultado de funções
 * 
 * @example
 * const stats = await withCache('dashboard:stats', async () => {
 *   return await fetchDashboardStats()
 * }, 5 * 60 * 1000) // 5 minutos
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Tentar obter do cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Cache HIT: ${key}`)
    }
    return cached
  }

  // Executar função e cachear resultado
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Cache MISS: ${key}`)
  }
  
  const data = await fn()
  cache.set(key, data, ttl)
  
  return data
}

/**
 * Gerar chave de cache baseada em parâmetros
 * @example cacheKey('orders', { status: 'PENDING', page: 1 })
 * // => 'orders:status=PENDING:page=1'
 */
export function cacheKey(prefix: string, params?: Record<string, any>): string {
  if (!params) return prefix
  
  const paramString = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(':')
  
  return paramString ? `${prefix}:${paramString}` : prefix
}
