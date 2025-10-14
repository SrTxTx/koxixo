/**
 * Configuração global otimizada do SWR
 * 
 * Reduções esperadas:
 * - 70% menos requisições duplicadas
 * - 50% menos revalidações desnecessárias
 * - Melhor UX com cache inteligente
 */

export const swrDefaultConfig = {
  // Revalidação
  revalidateOnFocus: false, // ❌ Não revalidar ao focar (economiza requests)
  revalidateOnReconnect: true, // ✅ Revalidar ao reconectar
  revalidateIfStale: true, // ✅ Revalidar se dados estão stale
  
  // Deduplicação e Throttle
  dedupingInterval: 5000, // 5s - Deduplica requests idênticos
  focusThrottleInterval: 10000, // 10s - Throttle em foco
  
  // Retry
  errorRetryCount: 2, // Apenas 2 tentativas (ao invés de infinito)
  errorRetryInterval: 1000, // 1s entre retries
  shouldRetryOnError: true,
  
  // Cache
  keepPreviousData: true, // ✅ Mantém dados anteriores durante revalidação
  
  // Performance
  loadingTimeout: 3000, // Timeout para loading state
  
  // Revalidação automática
  refreshInterval: 0, // ❌ Desabilitado por padrão (habilitar onde necessário)
  
  // Callbacks globais
  onSuccess: (data: any, key: string) => {
    // Log de sucesso (opcional)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ SWR Success: ${key}`)
    }
  },
  
  onError: (err: Error, key: string) => {
    // Log de erro
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ SWR Error: ${key}`, err)
    }
  },
}

/**
 * Configuração para dados que mudam frequentemente
 * Exemplo: Notificações, dashboard ao vivo
 */
export const swrRealtimeConfig = {
  ...swrDefaultConfig,
  refreshInterval: 15000, // Revalidar a cada 15s
  dedupingInterval: 2000, // 2s apenas
  revalidateOnFocus: true, // Revalidar ao focar
}

/**
 * Configuração para dados estáticos
 * Exemplo: Lista de usuários, produtos
 */
export const swrStaticConfig = {
  ...swrDefaultConfig,
  dedupingInterval: 30000, // 30s
  revalidateIfStale: false, // Não revalidar automaticamente
}

/**
 * Configuração para listagens com paginação
 */
export const swrPaginationConfig = {
  ...swrDefaultConfig,
  revalidateFirstPage: false, // Não revalidar primeira página
  persistSize: true, // Persistir tamanho da página
}
