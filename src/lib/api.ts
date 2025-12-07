export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8787'

export async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit'
  })
  if (!res.ok) {
    try {
      const json = await res.json()
      return json
    } catch {
      throw new Error(`Request failed: ${res.status}`)
    }
  }
  return res.json()
}
