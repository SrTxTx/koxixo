const { Client } = require('pg')

async function checkUsersTable() {
  const client = new Client({
    connectionString: 'postgresql://postgres.blrjmakfmaznsfoanaoh:Marlisson_27@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Conectando ao Supabase...')
    await client.connect()
    console.log('✅ Conectado!')

    // Verificar estrutura da tabela users
    console.log('\n📋 Verificando estrutura da tabela users...')
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)
    
    console.log('📊 Colunas da tabela users:')
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.column_default ? `[${col.column_default}]` : ''}`)
    })

    // Verificar dados na tabela users
    console.log('\n👥 Verificando dados na tabela users...')
    
    const usersResult = await client.query(`
      SELECT id, email, name, role, 
             length(password) as password_length,
             substring(password, 1, 20) || '...' as password_preview,
             created_at, updated_at
      FROM users 
      ORDER BY id;
    `)
    
    console.log(`📊 Total de usuários: ${usersResult.rows.length}`)
    
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`\n   ID: ${user.id}`)
        console.log(`   Nome: ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Password length: ${user.password_length}`)
        console.log(`   Password preview: ${user.password_preview}`)
        console.log(`   Created: ${user.created_at}`)
      })
      
      // Testar consulta específica para admin
      console.log('\n🔍 Testando consulta para admin@koxixo.com...')
      const adminResult = await client.query(`
        SELECT id, email, name, password, role
        FROM users 
        WHERE email = $1;
      `, ['admin@koxixo.com'])
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0]
        console.log('✅ Admin encontrado:')
        console.log(`   Hash completo: ${admin.password}`)
        
        // Testar hash com bcrypt
        const bcrypt = require('bcryptjs')
        const targetPassword = 'It250107@'
        const isValid = await bcrypt.compare(targetPassword, admin.password)
        console.log(`   🔐 Senha '${targetPassword}' válida: ${isValid ? '✅ SIM' : '❌ NÃO'}`)
        
      } else {
        console.log('❌ Admin não encontrado!')
      }
      
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela!')
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada')
  }
}

checkUsersTable()