# 🔄 Configuração Railway PostgreSQL

## ⚠️ Supabase está inacessível (DNS failed)

### 🚀 Solução: Railway PostgreSQL

#### 1. Criar Banco Railway:
1. Acesse: **https://railway.app**
2. Login com GitHub
3. "New Project" → "Provision PostgreSQL"
4. Aguarde 2-3 minutos

#### 2. Obter Connection String:
1. Clique no database criado
2. Aba "Connect" 
3. Copie "Postgres Connection URL"

#### 3. Atualizar .env:
```env
DATABASE_URL="postgresql://postgres:senha@railway.host:5432/database"
NEXTAUTH_SECRET="hG5x9v3J2QwK8sD6lXyR0tB7VfYpMz1H"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. Aplicar Schema:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

## 🎯 Railway vs Supabase:

| Feature | Railway | Supabase |
|---------|---------|----------|
| Conectividade | ✅ Sempre ativo | ❌ Pausa projetos |
| DNS | ✅ Estável | ❌ Pode falhar |
| Setup | ✅ Simples | ❌ Complexo |
| Gratuito | ✅ $5 crédito | ✅ Com limitações |

## 🔄 Voltar para SQLite (Temporário):

Se preferir continuar desenvolvimento:

```bash
# Schema
provider = "sqlite"

# .env  
DATABASE_URL="file:./dev.db"

# Aplicar
npx prisma generate
npx prisma db push
```

**Railway é a melhor opção para resolver isso rapidamente! 🚀**