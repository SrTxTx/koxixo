import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Criar usuários padrão
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@koxixo.com' },
    update: {},
    create: {
      email: 'admin@koxixo.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@koxixo.com' },
    update: {},
    create: {
      email: 'vendedor@koxixo.com',
      name: 'João Vendedor',
      password: hashedPassword,
      role: 'VENDEDOR',
    },
  })

  const orcamento = await prisma.user.upsert({
    where: { email: 'orcamento@koxixo.com' },
    update: {},
    create: {
      email: 'orcamento@koxixo.com',
      name: 'Maria Orçamento',
      password: hashedPassword,
      role: 'ORCAMENTO',
    },
  })

  const producao = await prisma.user.upsert({
    where: { email: 'producao@koxixo.com' },
    update: {},
    create: {
      email: 'producao@koxixo.com',
      name: 'Pedro Produção',
      password: hashedPassword,
      role: 'PRODUCAO',
    },
  })

  // Criar usuários adicionais para cada setor

  // Mais ADMINs
  const admin2 = await prisma.user.upsert({
    where: { email: 'carlos.admin@koxixo.com' },
    update: {},
    create: {
      email: 'carlos.admin@koxixo.com',
      name: 'Carlos Silva',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  const admin3 = await prisma.user.upsert({
    where: { email: 'ana.gerente@koxixo.com' },
    update: {},
    create: {
      email: 'ana.gerente@koxixo.com',
      name: 'Ana Gerente',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Mais VENDEDORs
  const vendedor2 = await prisma.user.upsert({
    where: { email: 'lucia.vendas@koxixo.com' },
    update: {},
    create: {
      email: 'lucia.vendas@koxixo.com',
      name: 'Lúcia Vendas',
      password: hashedPassword,
      role: 'VENDEDOR',
    },
  })

  const vendedor3 = await prisma.user.upsert({
    where: { email: 'marcos.comercial@koxixo.com' },
    update: {},
    create: {
      email: 'marcos.comercial@koxixo.com',
      name: 'Marcos Comercial',
      password: hashedPassword,
      role: 'VENDEDOR',
    },
  })

  const vendedor4 = await prisma.user.upsert({
    where: { email: 'fernanda.vendedora@koxixo.com' },
    update: {},
    create: {
      email: 'fernanda.vendedora@koxixo.com',
      name: 'Fernanda Vendedora',
      password: hashedPassword,
      role: 'VENDEDOR',
    },
  })

  // Mais ORÇAMENTOs
  const orcamento2 = await prisma.user.upsert({
    where: { email: 'roberto.orcamentos@koxixo.com' },
    update: {},
    create: {
      email: 'roberto.orcamentos@koxixo.com',
      name: 'Roberto Orçamentos',
      password: hashedPassword,
      role: 'ORCAMENTO',
    },
  })

  const orcamento3 = await prisma.user.upsert({
    where: { email: 'juliana.precos@koxixo.com' },
    update: {},
    create: {
      email: 'juliana.precos@koxixo.com',
      name: 'Juliana Preços',
      password: hashedPassword,
      role: 'ORCAMENTO',
    },
  })

  // Mais PRODUÇÃOs
  const producao2 = await prisma.user.upsert({
    where: { email: 'antonio.fabrica@koxixo.com' },
    update: {},
    create: {
      email: 'antonio.fabrica@koxixo.com',
      name: 'Antônio Fábrica',
      password: hashedPassword,
      role: 'PRODUCAO',
    },
  })

  const producao3 = await prisma.user.upsert({
    where: { email: 'sandra.impressora@koxixo.com' },
    update: {},
    create: {
      email: 'sandra.impressora@koxixo.com',
      name: 'Sandra Impressora',
      password: hashedPassword,
      role: 'PRODUCAO',
    },
  })

  const producao4 = await prisma.user.upsert({
    where: { email: 'jose.operador@koxixo.com' },
    update: {},
    create: {
      email: 'jose.operador@koxixo.com',
      name: 'José Operador',
      password: hashedPassword,
      role: 'PRODUCAO',
    },
  })

  // Criar alguns pedidos de exemplo
  await prisma.order.createMany({
    data: [
      {
        title: 'Pedido de Impressão 001',
        description: 'Impressão de 1000 cartões de visita',
        value: 150.00,
        status: 'PENDING',
        priority: 'MEDIUM',
        createdById: vendedor.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
      {
        title: 'Banner para Evento',
        description: 'Banner 3x2m para evento corporativo',
        value: 280.00,
        status: 'APPROVED',
        priority: 'HIGH',
        createdById: vendedor2.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      },
      {
        title: 'Folhetos Promocionais',
        description: 'Impressão de 5000 folhetos A4',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        createdById: vendedor3.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
      },
      {
        title: 'Cartões de Natal',
        description: 'Design e impressão de 2000 cartões de Natal personalizados',
        value: 320.00,
        status: 'COMPLETED',
        priority: 'HIGH',
        createdById: vendedor4.id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
      },
      {
        title: 'Material Institucional',
        description: 'Folders, catálogos e material promocional para empresa',
        value: 450.00,
        status: 'REJECTED',
        priority: 'LOW',
        createdById: vendedor.id,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      },
      {
        title: 'Adesivos Personalizados',
        description: 'Adesivos de diferentes tamanhos para branding',
        value: 180.00,
        status: 'DELIVERED',
        priority: 'MEDIUM',
        createdById: vendedor2.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Usuários criados por setor:')
  console.log('')
  console.log('🔧 ADMINISTRADORES:')
  console.log('  admin@koxixo.com / 123456 (Administrador)')
  console.log('  carlos.admin@koxixo.com / 123456 (Carlos Silva)')
  console.log('  ana.gerente@koxixo.com / 123456 (Ana Gerente)')
  console.log('')
  console.log('💼 VENDEDORES:')
  console.log('  vendedor@koxixo.com / 123456 (João Vendedor)')
  console.log('  lucia.vendas@koxixo.com / 123456 (Lúcia Vendas)')
  console.log('  marcos.comercial@koxixo.com / 123456 (Marcos Comercial)')
  console.log('  fernanda.vendedora@koxixo.com / 123456 (Fernanda Vendedora)')
  console.log('')
  console.log('💰 ORÇAMENTOS:')
  console.log('  orcamento@koxixo.com / 123456 (Maria Orçamento)')
  console.log('  roberto.orcamentos@koxixo.com / 123456 (Roberto Orçamentos)')
  console.log('  juliana.precos@koxixo.com / 123456 (Juliana Preços)')
  console.log('')
  console.log('🏭 PRODUÇÃO:')
  console.log('  producao@koxixo.com / 123456 (Pedro Produção)')
  console.log('  antonio.fabrica@koxixo.com / 123456 (Antônio Fábrica)')
  console.log('  sandra.impressora@koxixo.com / 123456 (Sandra Impressora)')
  console.log('  jose.operador@koxixo.com / 123456 (José Operador)')
  console.log('')
  console.log('📦 Pedidos de exemplo criados com diferentes status!')

  // Criar produtos de exemplo
  await (prisma as any).product.createMany({
    data: [
      { sku: 'PAPEL-A4-75', name: 'Papel Sulfite A4 75g', unit: 'PCT', price: 25.9, minStock: 10, currentStock: 50 },
      { sku: 'TINTA-CMYK', name: 'Kit Tinta CMYK', unit: 'KIT', price: 199.0, minStock: 2, currentStock: 5 },
      { sku: 'BANNER-LONA', name: 'Lona para Banner', unit: 'MT', price: 18.5, minStock: 20, currentStock: 200 },
    ],
    skipDuplicates: true,
  })
  console.log('📦 Produtos de estoque criados!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })