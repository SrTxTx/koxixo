import request from 'supertest'
const base = 'http://localhost:3010'

describe('Inventory', () => {
  beforeAll(async () => {}, 120000)

  it('should create a product and adjust stock', async () => {
    const agent = request.agent(base)

    const sku = 'TEST-' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const createRes = await agent
      .post('/api/estoque')
      .set('x-test-bypass-auth', '1')
      .redirects(2)
      .send({ sku, name: 'Produto Teste', unit: 'UN', currentStock: 10, minStock: 2 })

    expect([200, 201]).toContain(createRes.status)
    const productId = createRes.body?.id
    expect(productId).toBeTruthy()

    const inRes = await agent
      .post(`/api/estoque/${productId}`)
      .set('x-test-bypass-auth', '1')
      .redirects(2)
      .send({ type: 'IN', quantity: 5 })
    expect(inRes.status).toBe(201)
    expect(inRes.body?.product?.currentStock).toBe(15)

    const outRes = await agent
      .post(`/api/estoque/${productId}`)
      .set('x-test-bypass-auth', '1')
      .redirects(2)
      .send({ type: 'OUT', quantity: 3 })
    expect(outRes.status).toBe(201)
    expect(outRes.body?.product?.currentStock).toBe(12)

    const tooMuchOut = await agent
      .post(`/api/estoque/${productId}`)
      .set('x-test-bypass-auth', '1')
      .redirects(2)
      .send({ type: 'OUT', quantity: 9999 })
    expect(tooMuchOut.status).toBe(400)
  })
})
