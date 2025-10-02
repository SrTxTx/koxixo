const { Client } = require('pg')

async function connectToSupabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres.blrjmakfmaznsfoanaoh:Marlisson_27@aws-1-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Tentando conectar ao Supabase...')
    await client.connect()
    console.log('✅ Conectado com sucesso!')

    // Verificar se a tabela User existe
    console.log('\n📋 Verificando estrutura do banco...')
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    
    console.log('📊 Tabelas encontradas:')
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`)
    })

    // Se a tabela User existir, verificar os dados
    const userTableExists = tablesResult.rows.some(row => row.table_name === 'User')
    
    if (userTableExists) {
      console.log('\n👥 Verificando usuários na tabela User...')
      
      const usersResult = await client.query(`
        SELECT id, email, name, role, 
               length(password) as password_length,
               substring(password, 1, 20) || '...' as password_preview
        FROM "User" 
        ORDER BY id;
      `)
      
      console.log(`📊 Total de usuários: ${usersResult.rows.length}`)
      
      usersResult.rows.forEach(user => {
        console.log(`   ${user.id}: ${user.name} (${user.email}) - ${user.role}`)
        console.log(`      Password length: ${user.password_length}`)
        console.log(`      Password preview: ${user.password_preview}`)
      })
      
      // Testar uma consulta específica como o NextAuth faria
      console.log('\n🔍 Testando consulta específica para admin...')
      const adminResult = await client.query(`
        SELECT id, email, name, password, role
        FROM "User" 
        WHERE email = $1;
      `, ['admin@koxixo.com'])
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0]
        console.log('✅ Admin encontrado:')
        console.log(`   ID: ${admin.id}`)
        console.log(`   Email: ${admin.email}`)
        console.log(`   Nome: ${admin.name}`)
        console.log(`   Role: ${admin.role}`)
        console.log(`   Password hash: ${admin.password}`)
        console.log(`   Hash length: ${admin.password.length}`)
      } else {
        console.log('❌ Admin não encontrado!')
      }
      
    } else {
      console.log('❌ Tabela User não encontrada!')
      
      // Listar todas as tabelas para debug
      console.log('\n📋 Todas as tabelas disponíveis:')
      const allTables = await client.query(`
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        ORDER BY schemaname, tablename;
      `)
      
      allTables.rows.forEach(table => {
        console.log(`   ${table.schemaname}.${table.tablename}`)
      })
    }

  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await client.end()
    console.log('🔌 Conexão fechada')
  }
}

connectToSupabase()