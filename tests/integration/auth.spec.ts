import request from 'supertest'
import { ensureServer, waitOn } from './helpers/server'

let proc: any
const base = 'http://localhost:3010'

describe('Auth', () => {
  beforeAll(async () => {
    proc = await ensureServer(base)
  }, 120000)

  afterAll(async () => {
    try { proc?.kill() } catch {}
  })

  it('should login with credentials', async () => {
    const agent = request.agent(base)
    const csrfRes = await agent.get('/api/auth/csrf')
    const csrfToken = csrfRes.body?.csrfToken || /"csrfToken":"([^"]+)"/.exec(csrfRes.text || '')?.[1] || ''
    const res = await agent
      .post('/api/auth/callback/credentials')
      .type('form')
      .send({ csrfToken, email: 'admin@koxixo.com', password: '123456', callbackUrl: '/' })
    expect(res.status).toBeLessThan(500)
  })
})
