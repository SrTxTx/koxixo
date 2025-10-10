type Level = 'debug' | 'info' | 'warn' | 'error'

const isProd = process.env.NODE_ENV === 'production'

function log(level: Level, ...args: any[]) {
  if (isProd && level === 'debug') return
  const prefix = level.toUpperCase()
  // Mask secrets if any string contains database url
  const safeArgs = args.map((a) => {
    if (typeof a === 'string') return a.replace(/:[^:@/]+@/g, ':***@')
    return a
  })
  // eslint-disable-next-line no-console
  ;(console as any)[level](`[${prefix}]`, ...safeArgs)
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
}
