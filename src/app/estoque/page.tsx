'use client'

import { useEffect, useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { PlusCircle, Edit, Package, Search } from 'lucide-react'

interface Product {
  id: number
  sku: string
  name: string
  unit: string
  currentStock: number
  minStock?: number | null
  price?: number | null
}

interface ProductForm {
  sku: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  price: number
}

export default function EstoquePage() {
  const [items, setItems] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>({
    sku: '',
    name: '',
    unit: 'UN',
    currentStock: 0,
    minStock: 0,
    price: 0
  })

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
      credentials: 'include',
      body: JSON.stringify({ type, quantity: qty })
    })
    if (!res.ok) return alert('Falha ao ajustar estoque')
    await fetchData()
  }

  function openCreateModal() {
    setEditingProduct(null)
    setProductForm({
      sku: '',
      name: '',
      unit: 'UN',
      currentStock: 0,
      minStock: 0,
      price: 0
    })
    setShowCreateModal(true)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setProductForm({
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      currentStock: product.currentStock,
      minStock: product.minStock || 0,
      price: product.price || 0
    })
    setShowCreateModal(true)
  }

  async function handleSaveProduct() {
    if (!productForm.sku || !productForm.name) {
      return alert('SKU e Nome são obrigatórios')
    }

    try {
      const url = editingProduct 
        ? `/api/estoque/${editingProduct.id}`
        : '/api/estoque'
      
      const method = editingProduct ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(productForm)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao salvar produto')
      }

      setShowCreateModal(false)
      await fetchData()
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar produto')
    }
  }

  return (
    <ResponsiveLayout title="Estoque" subtitle="Controle de produtos e movimentações">
      <div className="space-y-6">
        {/* Header com busca e botão adicionar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                placeholder="Buscar por nome ou SKU"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={fetchData} 
                className="flex-1 md:flex-none px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Buscar
              </button>
              <button 
                onClick={openCreateModal}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Novo Produto
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          {loading && <p className="text-center py-4 text-gray-600 dark:text-gray-400">Carregando...</p>}
          {error && <p className="text-center py-4 text-red-600 dark:text-red-400">{error}</p>}
          
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">SKU</th>
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">Produto</th>
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">Estoque</th>
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">Mín.</th>
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">Preço</th>
                    <th className="p-3 text-gray-700 dark:text-gray-300 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-mono text-xs text-gray-900 dark:text-gray-100">{p.sku}</td>
                      <td className="p-3 text-gray-900 dark:text-gray-100">{p.name}</td>
                      <td className="p-3">
                        <span className={`${p.minStock && p.currentStock < p.minStock ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-gray-100'}`}>
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{p.minStock ?? '-'}</td>
                      <td className="p-3 text-gray-900 dark:text-gray-100">
                        {p.price ? `R$ ${p.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => ajustar(p.id, 'IN')} 
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            Entrada
                          </button>
                          <button 
                            onClick={() => ajustar(p.id, 'OUT')} 
                            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Saída
                          </button>
                          <button 
                            onClick={() => openEditModal(p)}
                            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar/Editar Produto */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">SKU *</label>
                <input
                  type="text"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: PROD-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nome *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ex: Camiseta Básica"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Unidade</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="CX">CX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Estoque Inicial</label>
                  <input
                    type="number"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}
