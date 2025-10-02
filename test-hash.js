const bcrypt = require('bcryptjs')

async function testPassword() {
  console.log('🧪 TESTE DE HASH DE SENHA\n')
  
  const targetPassword = 'It250107@'
  const existingHash = '$2a$10$F4EnQgc2voX6zxwzIlF7EevxrnC4jk7OfBke8UeKwid6ANeE4lVU.'
  
  console.log('📝 Dados do teste:')
  console.log(`   Senha: ${targetPassword}`)
  console.log(`   Hash existente: ${existingHash}`)
  console.log(`   Tamanho do hash: ${existingHash.length}`)
  console.log('')
  
  // Teste 1: Verificar se o hash existente funciona
  console.log('🔍 Teste 1: Verificando hash existente...')
  try {
    const isValid = await bcrypt.compare(targetPassword, existingHash)
    console.log(`   Resultado: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`)
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
  }
  console.log('')
  
  // Teste 2: Gerar novo hash
  console.log('🔄 Teste 2: Gerando novo hash...')
  try {
    const newHash = await bcrypt.hash(targetPassword, 10)
    console.log(`   Novo hash: ${newHash}`)
    console.log(`   Tamanho: ${newHash.length}`)
    
    // Teste 3: Verificar novo hash
    const isNewValid = await bcrypt.compare(targetPassword, newHash)
    console.log(`   Verificação: ${isNewValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`)
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`)
  }
  console.log('')
  
  // Teste 3: Testar outras senhas comuns
  console.log('🔍 Teste 3: Testando senhas comuns contra o hash existente...')
  const commonPasswords = ['123456', 'admin', 'password', 'It250107', 'It250107@']
  
  for (const password of commonPasswords) {
    try {
      const isValid = await bcrypt.compare(password, existingHash)
      console.log(`   ${password}: ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`)
    } catch (error) {
      console.log(`   ${password}: ❌ Erro - ${error.message}`)
    }
  }
  console.log('')
  
  // Teste 4: Criar hashes para todos os usuários
  console.log('🔄 Teste 4: Gerando hashes para todos os usuários...')
  const users = [
    { email: 'admin@koxixo.com', name: 'Admin' },
    { email: 'vendedor@koxixo.com', name: 'Vendedor' },
    { email: 'orcamento@koxixo.com', name: 'Orçamento' },
    { email: 'producao@koxixo.com', name: 'Produção' }
  ]
  
  for (const user of users) {
    const hash = await bcrypt.hash(targetPassword, 10)
    const isValid = await bcrypt.compare(targetPassword, hash)
    console.log(`   ${user.name} (${user.email}):`)
    console.log(`     Hash: ${hash}`)
    console.log(`     Válido: ${isValid ? '✅' : '❌'}`)
    console.log('')
  }
  
  console.log('🎉 Teste concluído!')
}

testPassword()