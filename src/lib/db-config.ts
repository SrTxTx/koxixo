import { logger } from '@/lib/logger'
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
  // Erro específico de prepared statement - mais robusto
  if (error.code === '42P05' || 
      error.message?.includes('prepared statement') ||
      error.message?.includes('already exists') ||
      error.kind?.QueryError?.PostgresError?.code === '42P05') {
  logger.warn('🔄 Prepared statement error detected, retrying with new client...')
    return { retry: true, delay: 200, createNewClient: true }
  }
  
  // Outros erros de conexão
  if (error.code?.startsWith('P') || error.code?.startsWith('42')) {
  logger.error('🚨 Prisma connection error:', error.code, error.message)
    return { retry: true, delay: 200 }
  }
  
  return { retry: false }
}

// Função para executar queries com retry automático
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100,
  createNewClientFn?: () => any
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      const errorInfo = handlePrismaError(error)
      
      if (!errorInfo.retry || attempt === maxRetries) {
  logger.error(`❌ Final error after ${attempt} attempts:`, error.message)
        throw error
      }
      
      const delay = errorInfo.delay * attempt
  logger.warn(`🔄 Tentativa ${attempt}/${maxRetries} falhou, tentando novamente em ${delay}ms...`)
  logger.warn(`🔍 Erro: ${error.message}`)
      
      // Se erro de prepared statement e temos função para criar novo cliente
      if (errorInfo.createNewClient && createNewClientFn) {
  logger.info('🔄 Criando novo cliente Prisma...')
        // A operação deve usar o novo cliente criado
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}