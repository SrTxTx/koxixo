# 🚀 Deploy no Vercel - Guia Completo

## 🔑 NEXTAUTH_SECRET Gerado:
```
aZy|1UgV!qqW%>D_DUt%k*A$bO7*!Bu/
```
**⚠️ IMPORTANTE: Copie este secret - será usado no Vercel!**

## 📋 Passos para Deploy:

### 1. Acesse o Vercel
- Site: https://vercel.com
- Faça login com sua conta GitHub

### 2. Importe o Projeto
- Clique em "New Project"
- Conecte ao GitHub se necessário
- Selecione o repositório: `SrTxTx/koxixo`
- Clique em "Import"

### 3. Configure as Variáveis de Ambiente
**MUITO IMPORTANTE!** Antes de fazer deploy, configure:

**Settings → Environment Variables:**

```env
NEXTAUTH_SECRET=aZy|1UgV!qqW%>D_DUt%k*A$bO7*!Bu/
NEXTAUTH_URL=https://koxixo.vercel.app
DATABASE_URL=file:./dev.db
NODE_ENV=production
```

### 4. Deploy
- Após configurar as variáveis, clique em "Deploy"
- Aguarde o build finalizar

### 5. Se Der Erro de Build
- Vá em "Settings → Environment Variables"
- Verifique se todas as variáveis estão corretas
- Clique em "Redeploy" na aba "Deployments"

## 🗄️ Banco de Dados (Importante!)

⚠️ **SQLite não funciona no Vercel!** Para produção, você precisa de um banco remoto:

### Opção 1: PlanetScale (Recomendado)
1. Crie conta em: https://planetscale.com
2. Crie um banco MySQL
3. Copie a `DATABASE_URL`
4. Atualize no Vercel: `DATABASE_URL=mysql://...`

### Opção 2: Supabase
1. Crie conta em: https://supabase.com
2. Crie um projeto PostgreSQL
3. Copie a `DATABASE_URL`
4. Atualize no Vercel: `DATABASE_URL=postgresql://...`

### Opção 3: Railway
1. Crie conta em: https://railway.app
2. Crie um banco PostgreSQL
3. Copie a `DATABASE_URL`
4. Atualize no Vercel: `DATABASE_URL=postgresql://...`

## 🔧 Se Quiser Manter SQLite (Temporário)
Para testar rapidamente, pode manter SQLite, mas:
- Os dados serão perdidos a cada deploy
- Não funciona em produção real
- Use apenas para demonstração

## ✅ Checklist de Deploy:

- [ ] Projeto importado no Vercel
- [ ] `NEXTAUTH_SECRET` configurado
- [ ] `NEXTAUTH_URL` configurado  
- [ ] `DATABASE_URL` configurado
- [ ] Banco de dados escolhido (PlanetScale/Supabase)
- [ ] Deploy realizado com sucesso
- [ ] Site funcionando: https://koxixo.vercel.app

## 🎯 URLs Finais:
- **Site**: https://koxixo.vercel.app
- **GitHub**: https://github.com/SrTxTx/koxixo
- **Vercel Dashboard**: https://vercel.com/dashboard

## 🆘 Problemas Comuns:

### Build falha
- Verifique se todas as variáveis de ambiente estão configuradas
- Certifique-se de que `NEXTAUTH_SECRET` não tem espaços

### Site carrega mas login não funciona
- Verifique se `NEXTAUTH_URL` está correto
- Deve ser: `https://koxixo.vercel.app` (sem / no final)

### Banco de dados não funciona
- SQLite não funciona no Vercel
- Use PlanetScale ou Supabase para produção

## 🎉 Sucesso!
Após seguir esses passos, seu sistema estará rodando em produção!

**Usuários padrão funcionarão após configurar o banco de dados remoto.**