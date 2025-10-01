# 🔧 Solução para Problemas de Conexão com Supabase

## ❌ Erro Atual:
```
Error: P1001: Can't reach database server at db.blrjmakfmaznsfoanaoh.supabase.co:5432
```

## 🔧 Possíveis Soluções:

### 1. Verificar Status do Banco Supabase
- Acesse: https://supabase.com/dashboard
- Verifique se o projeto está ativo (não pausado)
- Projetos gratuitos pausam após inatividade

### 2. Verificar String de Conexão
Na dashboard do Supabase:
- Settings → Database
- Connection string → URI
- Copie a string correta

### 3. Alternativa: Usar Banco Local para Desenvolvimento

#### Voltar para SQLite temporariamente:
```bash
# 1. Alterar schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

# 2. Gerar client
npx prisma generate

# 3. Aplicar schema
npx prisma db push

# 4. Popular com dados
npx prisma db seed
```

#### Manter PostgreSQL para produção:
```bash
# Para desenvolvimento local
DATABASE_URL="file:./dev.db"

# Para produção Vercel
DATABASE_URL="postgresql://postgres:senha@host:5432/database"
```

## 🚀 Solução Recomendada:

### 1. Criar Novo Banco Supabase
1. Acesse: https://supabase.com/dashboard
2. Crie novo projeto: `koxixo-production`
3. Copie nova string de conexão
4. Teste conectividade

### 2. Usar Railway (Alternativa)
1. Acesse: https://railway.app
2. Crie banco PostgreSQL
3. Conectividade mais estável

### 3. PlanetScale (MySQL)
1. Acesse: https://planetscale.com
2. Crie banco MySQL
3. Altere schema para `provider = "mysql"`

## 🔄 Script de Teste de Conectividade

Crie arquivo `test-db.js`:
```javascript
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Conexão com banco bem-sucedida!');
    await client.query('SELECT NOW()');
    console.log('✅ Query de teste executada!');
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
```

Execute com: `node test-db.js`

## 📋 Checklist de Debug:

- [ ] Banco Supabase está ativo
- [ ] String de conexão está correta
- [ ] Firewall permite conexão
- [ ] Projeto não está pausado
- [ ] Credenciais estão corretas

## 🎯 Solução Rápida:

1. **Desenvolver local com SQLite**
2. **Deploy no Vercel com PostgreSQL remoto**
3. **Configurar banco apenas na produção**

Quer que eu configure dessa forma?