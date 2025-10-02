// Teste de Login Programático
async function testLogin() {
  console.log('🧪 Testando login programático...\n')
  
  const testCredentials = [
    { email: 'admin@koxixo.com', password: 'It250107@', role: 'ADMIN' },
    { email: 'vendedor@koxixo.com', password: 'It250107@', role: 'VENDEDOR' },
    { email: 'orcamento@koxixo.com', password: 'It250107@', role: 'ORCAMENTO' },
    { email: 'producao@koxixo.com', password: 'It250107@', role: 'PRODUCAO' }
  ]
  
  for (const cred of testCredentials) {
    console.log(`🔑 Testando login: ${cred.email}`)
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password,
          callbackUrl: '/'
        })
      })
      
      console.log(`   Status: ${response.status}`)
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`)
      
      if (response.ok) {
        console.log('   ✅ Resposta OK')
      } else {
        console.log('   ❌ Erro na resposta')
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`)
    }
    
    console.log('')
  }
}

// Executa teste apenas se estiver rodando via Node.js
if (typeof window === 'undefined') {
  testLogin()
}