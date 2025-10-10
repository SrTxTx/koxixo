import { spawn } from 'child_process'

async function main() {
  const child = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    env: { ...process.env, PORT: '3001' },
    stdio: 'inherit'
  })
  process.on('SIGINT', () => child.kill())
  process.on('SIGTERM', () => child.kill())
}

main()
