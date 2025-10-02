const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Usa banco SQLite local para testes
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})

async function verifyAndUpdatePasswords() {
  try {
    console.log('🔍 Verificando senhas no banco local SQLite...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true
      }
    })

    console.log(`📊 Total de usuários encontrados: ${users.length}\n`)

    const targetPassword = 'It250107@'
    
    for (const user of users) {
      console.log(`👤 Usuário: ${user.name} (${user.email})`)
      console.log(`   Cargo: ${user.role}`)
      console.log(`   Hash atual: ${user.password}`)
      console.log(`   Tamanho do hash: ${user.password.length}`)
      
      // Verifica se a senha atual é válida
      const isCurrentValid = await bcrypt.compare(targetPassword, user.password)
      console.log(`   ✅ Senha '${targetPassword}' válida: ${isCurrentValid}`)
      
      if (!isCurrentValid) {
        console.log(`   🔄 Atualizando senha para ${user.email}...`)
        
        // Gera novo hash
        const newHash = await bcrypt.hash(targetPassword, 10)
        console.log(`   🔐 Novo hash: ${newHash}`)
        
        // Atualiza no banco
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        })
        
        // Verifica se o novo hash funciona
        const isNewValid = await bcrypt.compare(targetPassword, newHash)
        console.log(`   ✅ Novo hash válido: ${isNewValid}`)
      }
      
      console.log('')
    }

    console.log('🎉 Verificação concluída!')
    
    // Teste final com todos os usuários
    console.log('\n🧪 TESTE FINAL - Verificando todos os usuários:')
    const updatedUsers = await prisma.user.findMany()
    
    for (const user of updatedUsers) {
      const isValid = await bcrypt.compare(targetPassword, user.password)
      console.log(`${isValid ? '✅' : '❌'} ${user.email} - Senha válida: ${isValid}`)
    }

  } catch (error) {
    console.error('💥 Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAndUpdatePasswords()