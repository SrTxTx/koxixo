# 🎯 Nova Estrutura de Pedidos - Sistema Koxixo

## Data: 20 de Outubro de 2025

## 📋 Objetivo

Reformular completamente o sistema de criação de pedidos para refletir o processo real de confecção de cortinas, incluindo todos os dados necessários para produção, orçamento e instalação.

## 🆕 Novos Campos Adicionados ao Schema

### Dados do Cliente e Medidas
- `clientName` (String) - Nome do cliente
- `sellerName` (String) - Nome do vendedor (automático do usuário logado)
- `width` (Float) - Largura em metros
- `height` (Float) - Altura em metros

### Tipo de Acabamento (Checkboxes)
- `isReto` - Acabamento reto
- `isSemiReto` - Acabamento semi-reto
- `isComPregas` - Com pregas
- `isViraPau` - Vira pau
- `isIlhos` - Com ilhós
- `isIlhosEscondidos` - Ilhós escondidos
- `isOutroAcabamento` - Outro tipo
- `outroAcabamento` (String) - Campo texto para especificar

### Uso do Tecido (Checkboxes)
- `isPorAltura` - Por altura
- `isPorMetrosCorridos` - Por metros corridos
- `isPostico` - Postiço
- `isAbertoAoMeio` - Aberto ao meio
- `isEncaparCos` - Encapar a cós

### Observações
- `observations` (Text) - Campo livre para observações adicionais

### Tipo de Suporte (Checkboxes)
- `isTrilho` - Trilho
- `isTrilhoCurvo` - Trilho curvo
- `isVaraoVazado` - Varão vazado
- `isVaraGrossa` - Vara grossa
- `isVaraMedia` - Vara média
- `isCromado` - Cromado
- `isAcoEscovado` - Aço escovado
- `isPreto` - Preto
- `isBranco` - Branco
- `isBege` - Bege
- `isTabaco` - Tabaco

### Materiais (JSON)
Estrutura flexível para armazenar quantidades orçadas e usadas:

```json
{
  "tecido": { "orcada": 10.5, "usada": 10.0 },
  "postico": { "orcada": 2.0, "usada": 1.8 },
  "entrelinha": { "orcada": 5.0, "usada": 4.8 },
  "franzidor": { "orcada": 12.0, "usada": 11.5 },
  "entretela": { "orcada": 3.0, "usada": 3.0 },
  "ilhos": { "orcada": 20.0, "usada": 18.0 },
  "argolas": { "orcada": 15.0, "usada": 14.0 },
  "deslizantes": { "orcada": 10.0, "usada": 10.0 },
  "fitaWave": { "orcada": 8.0, "usada": 7.5 },
  "cordaoWave": { "orcada": 6.0, "usada": 6.0 },
  "terminal": { "orcada": 4.0, "usada": 4.0 },
  "personalizado1": { "orcada": 0, "usada": 0 },
  "personalizado2": { "orcada": 0, "usada": 0 }
}
```

### Instalação e Produção
- `installationStatus` (String) - "sim", "nao", "pendente"
- `seamstressName` (String) - Nome da costureira (preenchido pela produção)

## 🔄 Fluxo do Pedido Atualizado

### 1. Criação (VENDEDOR)
- Preenche dados do cliente
- Define medidas (largura x altura)
- Seleciona tipos de acabamento
- Define uso do tecido
- Adiciona observações
- Especifica tipo de suporte
- Informa quantidades orçadas de materiais
- Define status de instalação
- Informa prazo de entrega

### 2. Aprovação (ORÇAMENTO)
- Revisa todas as informações
- Aprova ou rejeita

### 3. Produção (PRODUCAO)
- Visualiza especificações completas
- Preenche nome da costureira
- Atualiza quantidades usadas de materiais
- Marca como concluído

### 4. Entrega (ADMIN/VENDEDOR)
- Confirma entrega ao cliente

## 📁 Arquivos Modificados

### Schema
- ✅ `prisma/schema.prisma` - Adicionados 30+ novos campos ao modelo Order

### API (A fazer)
- [ ] `src/app/api/pedidos/route.ts` - Atualizar POST para aceitar novos campos
- [ ] `src/app/api/pedidos/[id]/route.ts` - Atualizar PUT para novos campos

### Frontend (A fazer)
- [ ] `src/app/pedidos/novo/page.tsx` - Novo formulário completo
- [ ] `src/app/pedidos/page.tsx` - Atualizar visualização para mostrar novos dados

## 🎨 Layout do Novo Formulário

### Seções do Formulário:
1. **Dados do Cliente** - Nome do cliente + vendedor (automático)
2. **Medidas** - Largura e altura em metros
3. **Tipo de Acabamento** - Grid de checkboxes + campo "Outro"
4. **Uso do Tecido** - Checkboxes para tipo de uso
5. **Observações** - Textarea para notas adicionais
6. **Tipo de Suporte** - Grid de checkboxes para suportes e cores
7. **Materiais** - Tabela com 3 colunas (Material, Qtd Orçada, Qtd Usada)
8. **Instalação e Prazo** - Select para instalação + date picker

## 🚀 Próximos Passos

1. ✅ Atualizar schema do Prisma
2. ✅ Aplicar mudanças ao banco (prisma db push)
3. [ ] Atualizar API de criação de pedidos
4. [ ] Criar novo formulário de criação
5. [ ] Atualizar visualização de pedidos
6. [ ] Atualizar formulário de edição
7. [ ] Adicionar validações
8. [ ] Testes de integração

## 📝 Notas Importantes

- O campo `sellerName` é preenchido automaticamente com o nome do usuário logado
- O campo `seamstressName` só pode ser preenchido por usuários com perfil PRODUCAO
- Materiais personalizados permitem adicionar itens não listados
- Todas as medidas e quantidades usam Float para precisão
- Observações não são obrigatórias
- Sistema mantém compatibilidade com pedidos antigos (campos nullable)

## 🔐 Permissões

- **VENDEDOR**: Criar pedidos, ver seus próprios pedidos
- **ORCAMENTO**: Aprovar/rejeitar pedidos, ver todos os pedidos
- **PRODUCAO**: Ver pedidos aprovados, preencher costureira, atualizar quantidades usadas
- **ADMIN**: Acesso total, incluindo relatórios

---

**Status:** Schema atualizado ✅ | Formulário pendente ⏳
