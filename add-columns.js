const { PrismaClient } = require('@prisma/client')

async function addLastEditedColumns() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Adicionando colunas de última edição...')
    
    // Adicionar coluna last_edited_by_id
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD COLUMN last_edited_by_id INTEGER;
    `
    console.log('✅ Coluna last_edited_by_id adicionada')
    
    // Adicionar coluna last_edited_at
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD COLUMN last_edited_at TIMESTAMP WITHOUT TIME ZONE;
    `
    console.log('✅ Coluna last_edited_at adicionada')
    
    // Adicionar foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD CONSTRAINT fk_orders_last_edited_by 
      FOREIGN KEY (last_edited_by_id) REFERENCES users(id);
    `
    console.log('✅ Foreign key constraint adicionada')
    
    console.log('\n🎉 Campos de última edição adicionados com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addLastEditedColumns()