import request from 'supertest'
const base = 'http://localhost:3010'

async function loginAndGetAgent() {
  // For tests, rely on x-test-bypass-auth header handled by API
  return request.agent(base)
}

describe('Orders', () => {
  beforeAll(async () => {}, 120000)

  it('should create an order and then change status', async () => {
  const agent = await loginAndGetAgent()

    const created = await agent
      .post('/api/pedidos')
      .set('x-test-bypass-auth', '1')
  .redirects(2)
      .send({ title: 'Pedido Teste', description: 'desc', value: 10, priority: 'MEDIUM' })
    if (![200,201].includes(created.status)) {
      console.error('Create order failed:', created.status, created.body || created.text)
    }
    expect([200,201]).toContain(created.status)
    const id = created.body?.id || created.body?.order?.id
    expect(id).toBeTruthy()

    const approved = await agent
      .patch(`/api/pedidos/${id}`)
      .set('x-test-bypass-auth', '1')
      .redirects(2)
      .send({ action: 'approve' })
    expect(approved.status).toBe(200)
    expect(approved.body?.status || approved.body?.order?.status).toBe('APPROVED')
  })

  it('should export CSV and PDF', async () => {
    const agent = await loginAndGetAgent()
    const csv = await agent
      .get('/api/relatorios/export?format=csv&fields=id,title,status,priority,createdAt')
      .set('x-test-bypass-auth', '1')
      .redirects(2)
    expect(csv.status).toBe(200)
    expect(csv.headers['content-type']).toMatch(/text\/csv/)

    const pdf = await agent
      .get('/api/relatorios/export?format=pdf&fields=id,title,status,priority,createdAt')
      .set('x-test-bypass-auth', '1')
      .redirects(2)
    expect(pdf.status).toBe(200)
    expect(pdf.headers['content-type']).toMatch(/application\/pdf/)
  })
})
