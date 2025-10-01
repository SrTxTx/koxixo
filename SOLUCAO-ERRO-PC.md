# 🔧 Solução para Erro após Reiniciar PC

## ⚠️ Problema
Erro de webpack que aparece sempre que você reinicia o PC:
```
Call Stack
options.factory
file:///C:/Users/italo.silva/Documents/Projeto/.next/static/chunks/webpack.js (715:31)
```

## ✅ Solução Rápida

### Opção 1: Script Automático (Recomendado)
```bash
npm run fresh-start
```

### Opção 2: Limpeza Manual
```bash
# 1. Limpar cache
npm run clean:cache

# 2. Instalar dependências
npm install

# 3. Iniciar servidor
npm run dev
```

### Opção 3: Limpeza Completa (se o problema persistir)
```bash
npm run clean
```

## 🎯 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run fresh-start` | Limpa cache e inicia servidor (ideal após reiniciar PC) |
| `npm run clean:cache` | Limpa apenas cache Next.js e npm |
| `npm run clean` | Limpeza completa incluindo node_modules |
| `npm run dev` | Inicia servidor normal |

## 🔍 Causa do Problema

O Next.js cria cache em `.next/` que pode ficar corrompido quando:
- O sistema é desligado de forma inadequada
- Há atualizações do Node.js/npm
- Conflitos de versão entre dependências

## 💡 Solução Permanente

### 1. Configure next.config.js (✅ Já feito)
```javascript
const nextConfig = {
  experimental: {
    optimizePackageImports: ['next-auth', 'lucide-react']
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false // Desabilita cache em dev
    }
    return config
  }
}
```

### 2. Sempre use o script após reiniciar
```bash
npm run fresh-start
```

## 🚀 Acesso ao Sistema

Após executar a solução:
- **URL**: http://localhost:3001
- **Login**: admin@koxixo.com / 123456

## 📞 Se o Problema Persistir

1. Feche todos os editores de código
2. Execute: `npm run clean`
3. Reinicie o VS Code
4. Execute: `npm run dev`

---
💡 **Dica**: Sempre que reiniciar o PC, execute `npm run fresh-start` antes de trabalhar no projeto!