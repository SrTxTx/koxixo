# Koxixo - Sistema de Gestão de Pedidos

Sistema simples, rápido e bonito para gestão de pedidos com diferentes perfis de usuário.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS para estilização
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados local
- **NextAuth.js** - Autenticação
- **Lucide React** - Ícones

## 👥 Perfis de Usuário

### 🔐 Administrador
- Acesso total ao sistema
- Gerenciar usuários, pedidos e configurações

### 💼 Vendedor
- Criar novos pedidos
- Editar pedidos existentes
- Visualizar próprios pedidos

### 💰 Orçamento
- Aprovar ou recusar orçamentos
- Editar pedidos
- Adicionar valores aos pedidos
- Excluir pedidos

### 🏭 Produção
- Visualizar pedidos
- Marcar pedidos como prontos
- Comunicar status de produção

## 📊 Funcionalidades

### Dashboard
- Total de pedidos
- Pedidos cancelados
- Pedidos aprovados
- Pedidos atrasados

### Relatórios
- Pedidos por vendedor
- Pedidos atrasados
- Filtros personalizados
- Métricas detalhadas

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o banco de dados:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. Configure as variáveis de ambiente:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="seu-secret-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

## 🚀 Executando o Projeto

### Modo de Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
npm start
```

## 👤 Usuários de Teste

Após executar o seed, você pode usar os seguintes usuários:

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@koxixo.com | 123456 |
| Vendedor | vendedor@koxixo.com | 123456 |
| Orçamento | orcamento@koxixo.com | 123456 |
| Produção | producao@koxixo.com | 123456 |

## 📱 Design Responsivo

O sistema foi desenvolvido com foco em:
- **Performance** - Carregamento rápido e otimizado
- **Usabilidade** - Interface limpa e intuitiva
- **Responsividade** - Funciona em desktop, tablet e mobile
- **Acessibilidade** - Seguindo boas práticas

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   ├── login/            # Página de login
│   └── globals.css       # Estilos globais
├── components/            # Componentes reutilizáveis
├── lib/                  # Configurações e utilitários
│   ├── auth.ts           # Configuração NextAuth
│   └── prisma.ts         # Cliente Prisma
└── types/                # Definições de tipos TypeScript

prisma/
├── schema.prisma         # Schema do banco
├── seed.ts              # Dados iniciais
└── migrations/          # Migrações do banco
```

## 🔄 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linting
- `npx prisma studio` - Interface visual do banco
- `npx prisma db seed` - Popula banco com dados iniciais

## 🎨 Design System

### Cores Principais
- **Primary**: Azul (#3b82f6)
- **Success**: Verde (#10b981)
- **Warning**: Amarelo (#f59e0b)
- **Error**: Vermelho (#ef4444)
- **Gray**: Escala de cinzas para textos e fundos

### Componentes
- Cards responsivos com shadow suave
- Botões com estados hover e disabled
- Formulários com validação visual
- Navegação lateral expansível

## 🔒 Segurança

- Autenticação JWT com NextAuth.js
- Senhas hasheadas com bcryptjs
- Controle de acesso baseado em roles
- Validação de dados no servidor

## 📈 Próximas Funcionalidades

- [ ] Sistema de notificações
- [ ] Upload de arquivos para pedidos
- [ ] Histórico de alterações
- [ ] API REST completa
- [ ] Relatórios em PDF
- [ ] Sistema de comentários
- [ ] Dashboard com gráficos avançados

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.