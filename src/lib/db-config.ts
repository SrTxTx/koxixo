// Configurações específicas para PostgreSQL em produção
export const dbConfig = {
  // Configurações para resolver problemas de prepared statements em Vercel
  postgresql: {
    // Desabilita prepared statements se necessário
    schema: process.env.DATABASE_SCHEMA || 'public',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    // Pool de conexões otimizado para serverless
    connection: {
      max: 1, // Máximo de 1 conexão por função serverless
      min: 0, // Mínimo 0 para permitir cold starts
      acquire: 30000, // Timeout para adquirir conexão
      idle: 10000, // Tempo para manter conexão idle
    }
  }
}

// Função helper para tratar erros específicos do PostgreSQL
export const handlePrismaError = (error: any) => {
  // Erro específico de prepared statement
  if (error.code === '42P05') {
    console.log('🔄 Prepared statement error detected, retrying...')
    return { retry: true, delay: 100 }
  }
  
  // Outros erros de conexão
  if (error.code?.startsWith('P')) {
    console.log('🚨 Prisma connection error:', error.code, error.message)
    return { retry: true, delay: 200 }
  }
  
  return { retry: false }
}

// Função para executar queries com retry automático
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      const errorInfo = handlePrismaError(error)
      
      if (!errorInfo.retry || attempt === maxRetries) {
        throw error
      }
      
      const delay = errorInfo.delay * attempt
      console.log(`🔄 Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}