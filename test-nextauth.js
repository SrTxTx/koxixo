// Teste de login via NextAuth API sem usar Prisma diretamente
const testLogin = async () => {
  console.log('🧪 Teste de Login via NextAuth API\n')
  
  const credentials = {
    email: 'admin@koxixo.com',
    password: 'It250107@'
  }
  
  try {
    console.log('1️⃣ Enviando credenciais para NextAuth...')
    console.log(`   Email: ${credentials.email}`)
    console.log(`   Password: ***`)
    
    // Simulação do que o NextAuth faz internamente
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email,
        password: credentials.password,
        callbackUrl: '/dashboard',
        csrfToken: 'test-token'
      })
    })
    
    console.log('2️⃣ Resposta recebida:')
    console.log(`   Status: ${response.status}`)
    console.log(`   StatusText: ${response.statusText}`)
    
    const headers = Object.fromEntries(response.headers.entries())
    console.log('   Headers:', headers)
    
    if (response.status === 200 || response.status === 302) {
      console.log('✅ Login processado (redirecionamento ou success)')
      
      if (headers.location) {
        console.log(`   Redirecionamento para: ${headers.location}`)
      }
      
    } else {
      console.log('❌ Falha no login')
      const text = await response.text()
      console.log('   Response body:', text.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Para Node.js
if (typeof window === 'undefined') {
  testLogin()
}

// Para browser (se necessário)
if (typeof window !== 'undefined') {
  window.testLogin = testLogin
  console.log('Use window.testLogin() para executar o teste no browser')
}