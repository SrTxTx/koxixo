# 🔄 Configuração Dual: Desenvolvimento + Produção

## ✅ Status Atual:
- **Desenvolvimento Local**: SQLite funcionando ✅
- **Banco populado**: 14 usuários + pedidos de exemplo ✅
- **Produção**: Configurado para PostgreSQL ✅

## 🏠 **Desenvolvimento Local (Atual)**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
```

**Schema**: `provider = "sqlite"`

## 🚀 **Produção no Vercel**
```env
DATABASE_URL="postgresql://postgres:senha@host:5432/database"
NEXTAUTH_URL="https://koxixo.vercel.app"
```

**Schema**: `provider = "postgresql"`

## 🔧 **Como Alternar:**

### Para Desenvolvimento (SQLite):
1. No `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   ```
2. No `schema.prisma`:
   ```prisma
   provider = "sqlite"
   ```
3. Execute:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Para Produção (PostgreSQL):
1. No `.env`:
   ```
   DATABASE_URL="postgresql://..."
   ```
2. No `schema.prisma`:
   ```prisma
   provider = "postgresql"
   ```
3. Execute:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 🎯 **Para Deploy no Vercel:**

### 1. **Configure no Vercel:**
```env
NEXTAUTH_SECRET=aZy|1UgV!qqW%>D_DUt%k*A$bO7*!Bu/
NEXTAUTH_URL=https://koxixo.vercel.app
DATABASE_URL=postgresql://postgres:Marlisson_27@db.blrjmakfmaznsfoanaoh.supabase.co:5432/postgres
NODE_ENV=production
```

### 2. **Antes do Deploy:**
- Altere schema para `postgresql`
- Commit e push
- Deploy no Vercel

### 3. **Se Supabase não funcionar:**
- Use Railway: https://railway.app
- Use Neon: https://neon.tech
- Use outro provedor PostgreSQL

## 📋 **Comandos Úteis:**

```bash
# Resetar banco local
rm prisma/dev.db
npx prisma db push
npx prisma db seed

# Gerar client
npx prisma generate

# Ver banco no navegador
npx prisma studio

# Testar conexão
npx prisma db execute --command "SELECT 1"
```

## 🎉 **Sistema Funcionando:**
- ✅ **Local**: SQLite + 14 usuários
- ✅ **Pronto**: Para deploy com PostgreSQL
- ✅ **Flexível**: Pode alternar entre bancos

**Desenvolvimento local 100% funcional! 🚀**