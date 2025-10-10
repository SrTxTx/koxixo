export async function loadServerPreferences(): Promise<any> {
  try {
    const res = await fetch('/api/preferences', { cache: 'no-store' })
    if (!res.ok) return {}
    return await res.json()
  } catch { return {} }
}

export async function saveServerPreferences(prefs: any): Promise<boolean> {
  try {
    const res = await fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) })
    return res.ok
  } catch { return false }
}
