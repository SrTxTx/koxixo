# Koxixo - Usuários de Teste

## 🔐 Credenciais de Acesso

Todos os usuários utilizam a senha: **123456**

### 🔧 ADMINISTRADORES
Acesso total ao sistema - podem realizar todas as operações

| Email | Nome | Perfil |
|-------|------|--------|
| admin@koxixo.com | Administrador | ADMIN |
| carlos.admin@koxixo.com | Carlos Silva | ADMIN |
| ana.gerente@koxixo.com | Ana Gerente | ADMIN |

### 💼 VENDEDORES
Podem criar pedidos, visualizar todos os pedidos e marcar como entregue

| Email | Nome | Perfil |
|-------|------|--------|
| vendedor@koxixo.com | João Vendedor | VENDEDOR |
| lucia.vendas@koxixo.com | Lúcia Vendas | VENDEDOR |
| marcos.comercial@koxixo.com | Marcos Comercial | VENDEDOR |
| fernanda.vendedora@koxixo.com | Fernanda Vendedora | VENDEDOR |

### 💰 ORÇAMENTOS
Podem aprovar/rejeitar pedidos pendentes e criar orçamentos

| Email | Nome | Perfil |
|-------|------|--------|
| orcamento@koxixo.com | Maria Orçamento | ORCAMENTO |
| roberto.orcamentos@koxixo.com | Roberto Orçamentos | ORCAMENTO |
| juliana.precos@koxixo.com | Juliana Preços | ORCAMENTO |

### 🏭 PRODUÇÃO
Podem iniciar e finalizar produção dos pedidos aprovados

| Email | Nome | Perfil |
|-------|------|--------|
| producao@koxixo.com | Pedro Produção | PRODUCAO |
| antonio.fabrica@koxixo.com | Antônio Fábrica | PRODUCAO |
| sandra.impressora@koxixo.com | Sandra Impressora | PRODUCAO |
| jose.operador@koxixo.com | José Operador | PRODUCAO |

## 🔄 Fluxo de Trabalho

1. **VENDEDOR** cria um pedido (status: Pendente)
2. **ORÇAMENTO** aprova ou rejeita o pedido
3. **PRODUÇÃO** inicia a produção (status: Em Produção)
4. **PRODUÇÃO** finaliza a produção (status: Concluído)
5. **VENDEDOR** marca como entregue (status: Entregue)

## 🚀 Como Testar

1. Acesse http://localhost:3003/login
2. Escolha um dos usuários acima
3. Teste as funcionalidades específicas de cada perfil
4. Observe como as permissões mudam conforme o perfil logado

## 📊 Status dos Pedidos

- **Pendente**: Aguardando aprovação do orçamento
- **Aprovado**: Pronto para iniciar produção
- **Rejeitado**: Pedido rejeitado pelo orçamento
- **Em Produção**: Sendo produzido
- **Concluído**: Produção finalizada
- **Entregue**: Produto entregue ao cliente
- **Cancelado**: Pedido cancelado

## 🎯 Prioridades

- **Alta**: Urgente (vermelho)
- **Média**: Normal (amarelo)
- **Baixa**: Não urgente (verde)