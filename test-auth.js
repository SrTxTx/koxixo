const { authOptions } = require('./src/lib/auth')
const { prisma } = require('./src/lib/prisma')

async function testAuth() {
  console.log('Testing authentication...')

  // Test user lookup
  const user = await prisma.user.findUnique({
    where: { email: 'admin@koxixo.com' }
  })

  console.log('User found:', user ? 'YES' : 'NO')
  if (user) {
    console.log('User email:', user.email)
    console.log('User role:', user.role)
  }

  // Test password comparison
  if (user) {
    const bcrypt = require('bcryptjs')
    const isValid = await bcrypt.compare('123456', user.password)
    console.log('Password valid:', isValid)
  }

  // Test authorize function
  const credentialsProvider = authOptions.providers.find((p) => p.id === 'credentials')
  if (credentialsProvider?.options?.authorize) {
    const result = await credentialsProvider.options.authorize({
      email: 'admin@koxixo.com',
      password: '123456'
    })
    console.log('Authorize result:', result ? 'SUCCESS' : 'FAILED')
    if (result) {
      console.log('Authorized user:', result.name, result.role)
    }
  }

  await prisma.$disconnect()
}

testAuth().catch(console.error)