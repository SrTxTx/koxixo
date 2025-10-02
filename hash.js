import bcrypt from 'bcryptjs'

async function gerarHash() {
  const password = 'It250107@'  // sua senha
  const hash = await bcrypt.hash(password, 10)
  console.log(hash)
}

gerarHash()
