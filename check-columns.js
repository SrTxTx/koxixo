const { PrismaClient } = require('@prisma/client')

async function checkColumns() {
  const prisma = new PrismaClient()
  
  try {
    // Tentar buscar as colunas da tabela orders
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public'
      ORDER BY column_name;
    `
    
    console.log('Colunas da tabela orders:')
    console.log(result)
    
    // Verificar especificamente as colunas de última edição
    const hasLastEditedBy = result.some(col => col.column_name === 'last_edited_by_id')
    const hasLastEditedAt = result.some(col => col.column_name === 'last_edited_at')
    
    console.log('\n--- Status dos campos de última edição ---')
    console.log('last_edited_by_id existe:', hasLastEditedBy)
    console.log('last_edited_at existe:', hasLastEditedAt)
    
    if (!hasLastEditedBy || !hasLastEditedAt) {
      console.log('\n⚠️ Campos de última edição não existem. Precisam ser adicionados.')
    } else {
      console.log('\n✅ Campos de última edição já existem!')
    }
    
  } catch (error) {
    console.error('Erro ao verificar colunas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkColumns()