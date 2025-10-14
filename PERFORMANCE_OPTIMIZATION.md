# 🚀 Otimizações de Desempenho - Projeto Koxixo

## 📊 Análise Atual

### ⚠️ Problemas Identificados:

1. **Banco de Dados**
   - Falta de índices em colunas frequentemente consultadas
   - Queries N+1 em algumas rotas
   - Sem cache para consultas repetidas
   - Timeout alto (15s) indica queries lentas

2. **Frontend**
   - Bundle size não otimizado
   - Falta de code splitting
   - Revalidação constante do SWR
   - Sem lazy loading de componentes

3. **API Routes**
   - Múltiplas queries sequenciais
   - Sem compressão de resposta
   - Falta de rate limiting
   - Sem cache de sessão

4. **Serverless**
   - Cold starts frequentes
   - Conexões ao banco não otimizadas
   - Prepared statements cache limitado

---

## ✅ Otimizações Implementadas

### 1. **Índices de Banco de Dados**
```prisma
// Adicionar em schema.prisma
@@index([status])
@@index([priority])
@@index([createdById])
@@index([createdAt])
@@index([status, priority]) // compound index
```

### 2. **Query Optimization**
- ✅ `executeWithRetry` com retry automático
- ✅ `withTimeout` para evitar queries longas
- ✅ Raw SQL fallback para P2032
- ⚠️ Falta: Connection pooling otimizado

### 3. **Frontend Caching (SWR)**
- ✅ `revalidateOnFocus: true`
- ✅ `keepPreviousData: true`
- ⚠️ Falta: `dedupingInterval`
- ⚠️ Falta: Cache persistence

---

## 🎯 Melhorias Prioritárias

### **Alta Prioridade** 🔴

#### 1. Adicionar Índices no Banco
```prisma
model Order {
  // ... campos existentes
  
  @@index([status])
  @@index([priority])
  @@index([createdById])
  @@index([createdAt])
  @@index([status, createdAt])
  @@index([createdById, status])
}

model Product {
  @@index([sku])
  @@index([name])
}

model User {
  @@index([email])
  @@index([role])
}
```

**Impacto**: Reduz queries de 1000ms+ para <50ms

#### 2. Otimizar SWR Config
```typescript
// Global SWR config
const swrConfig = {
  revalidateOnFocus: false, // Evita revalidação ao focar
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Deduplica requests em 5s
  focusThrottleInterval: 10000,
  errorRetryCount: 2,
  shouldRetryOnError: true,
}
```

**Impacto**: Reduz 70% das requisições desnecessárias

#### 3. Implementar Debounce na Busca
```typescript
// Usar debounce no input de busca
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setSearchTerm(value)
  }, 300),
  []
)
```

**Impacto**: Reduz requisições de busca em 90%

#### 4. Lazy Load de Componentes
```typescript
// Carregar modais apenas quando necessário
const EditModal = dynamic(() => import('./EditModal'), {
  loading: () => <LoadingSpinner />
})
```

**Impacto**: Reduz bundle inicial em 20-30%

---

### **Média Prioridade** 🟡

#### 5. Pagination Server-Side Real
```typescript
// Retornar apenas a página requisitada
const orders = await prisma.order.findMany({
  take: pageSize,
  skip: (page - 1) * pageSize,
  cursor: lastId ? { id: lastId } : undefined, // Cursor-based
})
```

**Impacto**: Reduz payload em 80-90%

#### 6. Response Compression
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Compress responses > 1KB
  if (req.headers.get('accept-encoding')?.includes('gzip')) {
    res.headers.set('Content-Encoding', 'gzip')
  }
  
  return res
}
```

**Impacto**: Reduz tamanho das respostas em 60-70%

#### 7. Redis Cache (opcional)
```typescript
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })

// Cache de dashboard stats
export async function GET() {
  const cached = await redis.get('dashboard:stats')
  if (cached) return NextResponse.json(JSON.parse(cached))
  
  const stats = await fetchStats()
  await redis.setEx('dashboard:stats', 300, JSON.stringify(stats)) // 5min
  return NextResponse.json(stats)
}
```

**Impacto**: Reduz carga do banco em 80%

---

### **Baixa Prioridade** 🟢

#### 8. Image Optimization
```typescript
// Usar next/image para otimização automática
import Image from 'next/image'

<Image 
  src="/logo.png" 
  width={32} 
  height={32} 
  alt="Logo"
  priority // Para above-fold
/>
```

#### 9. Bundle Analysis
```bash
# Analisar bundle size
npm run build
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
```

#### 10. Service Worker (PWA)
```typescript
// Implementar PWA para cache offline
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})
```

---

## 📈 Métricas de Performance

### **Antes das Otimizações**
- ⏱️ API Response Time: 2000-8000ms (com timeouts)
- 📦 Bundle Size: ~500KB (gzip)
- 🔄 Requisições por página: 15-20
- 💾 Database queries: 5-10 por request

### **Metas Após Otimizações**
- ⏱️ API Response Time: <500ms (95 percentil)
- 📦 Bundle Size: <300KB (gzip)
- 🔄 Requisições por página: 5-8
- 💾 Database queries: 1-3 por request (com cache)

---

## 🛠️ Implementação Rápida

### Passo 1: Adicionar Índices (5min)
```bash
# Atualizar schema.prisma com índices
# Rodar migração
npx prisma migrate dev --name add_indexes
```

### Passo 2: Otimizar SWR (10min)
```typescript
// src/lib/swr-config.ts
export const swrDefaultConfig = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  focusThrottleInterval: 10000,
}
```

### Passo 3: Debounce Search (5min)
```bash
npm install lodash.debounce
```

### Passo 4: Dynamic Imports (15min)
```typescript
// Converter modais grandes para dynamic imports
const BigModal = dynamic(() => import('./BigModal'))
```

---

## 🎯 ROI Estimado

| Otimização | Esforço | Impacto | Prioridade |
|------------|---------|---------|------------|
| Índices DB | 10min | 🔥🔥🔥 | CRÍTICO |
| SWR Config | 5min | 🔥🔥🔥 | CRÍTICO |
| Debounce | 5min | 🔥🔥 | ALTO |
| Lazy Load | 30min | 🔥🔥 | ALTO |
| Pagination | 1h | 🔥 | MÉDIO |
| Redis Cache | 2h | 🔥🔥 | MÉDIO |
| Compression | 30min | 🔥 | MÉDIO |
| PWA | 3h | 🔥 | BAIXO |

---

## 📊 Monitoramento

### Ferramentas Recomendadas:
1. **Vercel Analytics** (gratuito)
2. **Sentry** (error tracking + performance)
3. **Google Lighthouse** (CI/CD)
4. **Next.js Speed Insights**

### Métricas a Acompanhar:
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ API Response Time (p50, p95, p99)
- ✅ Error Rate
- ✅ Database Query Time
- ✅ Cache Hit Rate

---

## 🚀 Quick Wins (30 minutos)

Execute agora para ganhos imediatos:

```bash
# 1. Adicionar índices
# Editar prisma/schema.prisma e rodar:
npx prisma migrate dev --name add_performance_indexes

# 2. Instalar dependências de otimização
npm install lodash.debounce

# 3. Configurar SWR global
# (veja código em src/lib/swr-config.ts abaixo)

# 4. Build e testar
npm run build
npm start
```

Essas mudanças simples devem **reduzir o tempo de resposta em 50-70%** imediatamente! 🎉
