import { spawn } from 'child_process'
import http from 'http'

function runCmd(cmd: string, args: string[], opts: any = {}) {
  const isWin = process.platform === 'win32'
  return new Promise<void>((resolve, reject) => {
    const p = spawn(isWin ? `${cmd}.cmd` : cmd, args, { shell: isWin, stdio: 'inherit', ...opts })
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`)))
  })
}

async function waitOn(url: string, timeoutMs = 120000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => { res.resume(); resolve() })
        req.on('error', reject)
      })
      return
    } catch {
      await new Promise(r => setTimeout(r, 500))
    }
  }
  throw new Error('Server not reachable: ' + url)
}

export default async function setup() {
  const base = 'http://localhost:3010'
  const url = new URL(base)
  const port = url.port || '3010'
  process.env.PORT = String(port)
  process.env.NEXTAUTH_URL = `http://localhost:${port}`
  process.env.TEST_BYPASS_AUTH = '1'

  // Prepare database
  try {
    await runCmd('npx', ['prisma', 'db', 'push', '--force-reset'])
    await runCmd('npx', ['prisma', 'db', 'seed'])
  } catch (e) {
    // In dev, allow using existing DB if reset fails (e.g., remote DB not reachable)
    console.warn('⚠️  prisma db push/seed falhou, prosseguindo com DB existente:', (e as any)?.message)
  }

  // Start server
  const isWin = process.platform === 'win32'
  const child = spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '-p', String(port)], {
    shell: isWin,
    env: { ...process.env },
    stdio: 'inherit'
  })

  await waitOn(base)

  // Prewarm critical endpoints
  await Promise.all([
    new Promise<void>((resolve) => {
      const req = http.get(`${base}/api/pedidos`, (res) => { res.resume(); resolve() })
      req.on('error', () => resolve())
    }),
    new Promise<void>((resolve) => {
      const req = http.get(`${base}/api/users`, (res) => { res.resume(); resolve() })
      req.on('error', () => resolve())
    }),
  ])

  return async () => {
    try { child.kill() } catch {}
  }
}
