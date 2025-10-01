# 🚀 Solução: Railway PostgreSQL (Alternativa ao Supabase)

## ❌ Problema Atual:
Supabase não está acessível da sua rede (P1001 error)

## ✅ Solução: Railway PostgreSQL

### 1. Criar Banco no Railway:
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique "New Project"
4. Escolha "Provision PostgreSQL"
5. Aguarde criação

### 2. Obter Connection String:
1. Clique no banco criado
2. Aba "Connect"
3. Copie "Postgres Connection URL"
4. Formato: `postgresql://postgres:password@host:port/database`

### 3. Atualizar .env:
```env
DATABASE_URL="postgresql://[railway_connection_string]"
NEXTAUTH_SECRET="hG5x9v3J2QwK8sD6lXyR0tB7VfYpMz1H"
NEXTAUTH_URL="https://koxixo.vercel.app"
```

### 4. Aplicar Schema:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 🎯 Alternativa Rápida: Neon

### 1. Criar no Neon:
- Site: https://neon.tech
- Mais estável que Supabase
- Connection string direto

### 2. Configuração:
```env
DATABASE_URL="postgresql://[neon_connection_string]"
```

## 🔄 Enquanto isso, voltar para SQLite:

Se quiser continuar desenvolvendo:

```bash
# Voltar schema para sqlite
provider = "sqlite"

# Voltar .env
DATABASE_URL="file:./dev.db"

# Aplicar
npx prisma generate
npx prisma db push
```

## 📝 Para Vercel:

Configure as mesmas variáveis no Vercel:
```env
DATABASE_URL=postgresql://[railway_ou_neon_url]
NEXTAUTH_SECRET=hG5x9v3J2QwK8sD6lXyR0tB7VfYpMz1H
NEXTAUTH_URL=https://koxixo.vercel.app
```

**Railway é mais confiável que Supabase para esse tipo de conexão! 🚀**