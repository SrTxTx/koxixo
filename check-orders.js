const { Client } = require('pg')

async function checkOrdersTable() {
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

    // Verificar estrutura da tabela orders
    console.log('\n📋 Verificando estrutura da tabela orders...')
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)
    
    console.log('📊 Colunas da tabela orders:')
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.column_default ? `[${col.column_default}]` : ''}`)
    })

    // Verificar se há dados na tabela
    console.log('\n📦 Verificando dados na tabela orders...')
    
    const ordersResult = await client.query(`
      SELECT COUNT(*) as total FROM orders;
    `)
    
    console.log(`📊 Total de pedidos: ${ordersResult.rows[0].total}`)

    if (ordersResult.rows[0].total > 0) {
      console.log('\n📄 Primeiros pedidos:')
      const sampleOrders = await client.query(`
        SELECT id, title, status, priority, created_at, due_date
        FROM orders 
        ORDER BY id 
        LIMIT 3;
      `)
      
      sampleOrders.rows.forEach(order => {
        console.log(`   ${order.id}: ${order.title} (${order.status})`)
      })
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await client.end()
    console.log('\n🔌 Conexão fechada')
  }
}

checkOrdersTable()