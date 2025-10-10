import { spawn, type ChildProcess } from 'child_process'
import http from 'http'

export async function waitOn(url: string, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          res.resume();
          resolve()
        })
        req.on('error', reject)
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  throw new Error('Server not reachable: ' + url)
}

export async function ensureServer(baseUrl = 'http://localhost:3010') {
  // Always spawn a dedicated test server to control env
  const isWin = process.platform === 'win32'
  const cmd = isWin ? 'npm.cmd' : 'npm'
  const url = new URL(baseUrl)
  const port = url.port || '3010'
  const args = ['run', 'dev', '--', '-p', port]
  const child = spawn(cmd, args, {
    shell: isWin,
    env: { ...process.env, PORT: port, NEXTAUTH_URL: `http://localhost:${port}`, TEST_BYPASS_AUTH: '1' },
    stdio: 'ignore'
  })
  await waitOn(baseUrl)
  // Prewarm key routes to avoid first-request compilation delays
  await new Promise<void>((resolve) => {
    const req = http.get(`${baseUrl}/api/auth/test`, (res) => { res.resume(); resolve() })
    req.on('error', () => resolve())
  })
  await new Promise<void>((resolve) => {
    const req = http.get(`${baseUrl}/api/pedidos`, (res) => { res.resume(); resolve() })
    req.on('error', () => resolve())
  })
  return child
}
