'use client'

import { useEffect, useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'

interface Product {
  id: number
  sku: string
  name: string
  unit: string
  currentStock: number
  minStock?: number | null
}

export default function EstoquePage() {
  const [items, setItems] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/estoque', window.location.origin)
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString(), { credentials: 'include' })
      if (!res.ok) throw new Error('Falha ao carregar estoque')
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function ajustar(id: number, type: 'IN' | 'OUT') {
    const value = prompt(`Quantidade para ${type === 'IN' ? 'entrada' : 'saída'}:`)
    if (!value) return
    const qty = parseInt(value, 10)
    if (isNaN(qty) || qty <= 0) return alert('Quantidade inválida')
    const res = await fetch(`/api/estoque/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, quantity: qty })
    })
    if (!res.ok) return alert('Falha ao ajustar estoque')
    await fetchData()
  }

  return (
    <ResponsiveLayout title="Estoque" subtitle="Controle de produtos e movimentações">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou SKU"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button onClick={fetchData} className="px-3 py-2 bg-red-600 text-white rounded">Buscar</button>
        </div>
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">SKU</th>
                <th className="p-2">Produto</th>
                <th className="p-2">Estoque</th>
                <th className="p-2">Min.</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-2 font-mono">{p.sku}</td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.currentStock} {p.unit}</td>
                  <td className="p-2">{p.minStock ?? '-'}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => ajustar(p.id, 'IN')} className="px-2 py-1 bg-green-600 text-white rounded">Entrada</button>
                    <button onClick={() => ajustar(p.id, 'OUT')} className="px-2 py-1 bg-blue-600 text-white rounded">Saída</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
