# 📤 Preparando o Projeto para o GitHub

## ✅ Arquivos de Configuração Criados

- ✅ `.gitignore` - Ignora arquivos desnecessários (node_modules, .env, etc.)
- ✅ `.env.example` - Template das variáveis de ambiente
- ✅ `LICENSE` - Licença MIT
- ✅ `README.md` - Documentação completa
- ✅ `init-git.bat` - Script para inicializar Git

## 🔧 Pré-requisitos

### 1. Instalar o Git
Se o Git não estiver instalado:
- Baixe em: https://git-scm.com/download/windows
- Instale com as configurações padrão
- Reinicie o terminal

### 2. Configurar Git (primeira vez)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```

## 🚀 Passos para Enviar ao GitHub

### Opção 1: Usando o Script Automático
1. Execute o arquivo `init-git.bat`
2. Siga as instruções na tela

### Opção 2: Manual

#### 1. Inicializar Repositório
```bash
git init
```

#### 2. Adicionar Arquivos
```bash
git add .
```

#### 3. Primeiro Commit
```bash
git commit -m "feat: Sistema completo de gestão de pedidos

- Sistema de autenticação com 4 perfis (Admin, Vendedor, Orçamento, Produção)
- CRUD completo de pedidos com fluxo de aprovação
- Gerenciamento de usuários (apenas para admins)
- Dashboard com estatísticas em tempo real
- Interface responsiva com Tailwind CSS
- API RESTful com Next.js
- Banco de dados SQLite com Prisma ORM
- Sistema de reenvio de pedidos rejeitados"
```

#### 4. Criar Repositório no GitHub
1. Acesse https://github.com
2. Clique em "New repository"
3. Nome: `koxixo-sistema-pedidos`
4. Descrição: `Sistema de gestão de pedidos com Next.js e TypeScript`
5. Marque como **Público** ou **Privado**
6. **NÃO** marque "Add a README file" (já temos um)
7. Clique em "Create repository"

#### 5. Conectar Repositório Local ao GitHub
```bash
git remote add origin https://github.com/SEU_USUARIO/koxixo-sistema-pedidos.git
git branch -M main
git push -u origin main
```

## 📋 Checklist Antes do Push

- [ ] Arquivo `.env` está no `.gitignore` ✅
- [ ] Não há dados sensíveis no código ✅
- [ ] README.md está completo ✅
- [ ] Licença está definida ✅
- [ ] package.json está configurado ✅
- [ ] Scripts de build funcionam ✅

## 🔒 Variáveis de Ambiente

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env`!

Para outros desenvolvedores, eles devem:
1. Copiar `.env.example` para `.env`
2. Configurar suas próprias variáveis
3. Executar `npm install` e `npx prisma generate`

## 🚀 Deploy na Vercel (Opcional)

Após subir no GitHub:

1. Acesse https://vercel.com
2. Conecte sua conta GitHub
3. Importe o repositório
4. Configure variáveis de ambiente:
   - `DATABASE_URL` (use PostgreSQL para produção)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
5. Deploy automático!

## 🔗 URLs Sugeridas

- **Repositório**: `koxixo-sistema-pedidos`
- **Demo**: `koxixo-sistema-pedidos.vercel.app`
- **Documentação**: No próprio README.md

## 🎯 Próximos Passos

1. Subir no GitHub
2. Configurar Issues/Projects para melhorias
3. Criar branches para novas features
4. Configurar CI/CD se necessário
5. Documentar API com Swagger (futuro)

## 📞 Suporte

Se encontrar problemas:
1. Verifique se Git está instalado
2. Confira se as variáveis de ambiente estão corretas
3. Execute `npm run clean` se houver problemas de cache