# 🗄️ Configuração de Banco de Dados para Vercel

## ⚠️ Problema: SQLite não funciona no Vercel!

O Vercel é serverless e não suporta SQLite em produção. Você precisa de um banco remoto.

## 🚀 Solução Rápida: PlanetScale (Recomendado)

### 1. Criar Conta PlanetScale
- Acesse: https://planetscale.com
- Crie conta gratuita
- Crie um novo banco: `koxixo-db`

### 2. Obter Connection String
- No painel do PlanetScale
- Vá em "Connect" → "Prisma"
- Copie a `DATABASE_URL`

### 3. Atualizar Schema Prisma
No arquivo `prisma/schema.prisma`, mude:

```prisma
datasource db {
  provider = "mysql"  // Era "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Configurar no Vercel
- Vercel → Settings → Environment Variables
- Atualize: `DATABASE_URL=mysql://...` (cole do PlanetScale)

### 5. Gerar Migration
No seu computador local:
```bash
npx prisma db push
npx prisma generate
```

### 6. Redeploy no Vercel
- Vá na aba "Deployments"
- Clique em "Redeploy"

## 🔄 Alternativa: Supabase (PostgreSQL)

### 1. Criar Projeto Supabase
- Acesse: https://supabase.com
- Crie projeto gratuito

### 2. Obter Connection String
- Settings → Database
- Copie "Connection string"
- Formato: `postgresql://...`

### 3. Atualizar Schema
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 📝 Passo a Passo Completo:

### Para PlanetScale (MySQL):
1. ✅ Criar conta PlanetScale
2. ✅ Criar banco `koxixo-db`
3. ✅ Copiar CONNECTION_STRING
4. ✅ Mudar `provider = "mysql"` no schema.prisma
5. ✅ Configurar DATABASE_URL no Vercel
6. ✅ Fazer redeploy

### Scripts Úteis:
```bash
# Resetar migrações (se necessário)
rm -rf prisma/migrations

# Aplicar schema no novo banco
npx prisma db push

# Gerar client
npx prisma generate

# Popular com dados de teste
npx prisma db seed
```

## 🎯 Variáveis Finais no Vercel:

```env
NEXTAUTH_SECRET=aZy|1UgV!qqW%>D_DUt%k*A$bO7*!Bu/
NEXTAUTH_URL=https://koxixo.vercel.app
DATABASE_URL=mysql://[PlanetScale_Connection_String]
NODE_ENV=production
```

## ✅ Checklist:
- [ ] Banco remoto criado (PlanetScale/Supabase)
- [ ] Schema atualizado (mysql/postgresql)
- [ ] DATABASE_URL configurada no Vercel
- [ ] Migration aplicada
- [ ] Redeploy realizado
- [ ] Site funcionando com banco remoto

**Após isso, o sistema funcionará perfeitamente no Vercel! 🚀**