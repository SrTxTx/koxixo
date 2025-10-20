'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ResponsiveLayout } from '../../../components/layout/ResponsiveLayout'

export default function NovoPedidoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && !['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)) {
      router.push('/dashboard') // Redireciona se não tiver permissão
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, value, priority, dueDate }),
      })

      if (response.ok) {
        router.push('/pedidos')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao criar pedido.')
      }
    } catch (err) {
      setError('Ocorreu um erro de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <ResponsiveLayout title="Novo Pedido" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout
      title="Novo Pedido"
      subtitle="Preencha os dados para criar um novo pedido"
      actions={
        <Link href="/pedidos">
          <button className="btn-ghost inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </button>
        </Link>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Pedido</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 input-field"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="mt-1 input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                <input
                  type="number"
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  step="0.01"
                  className="mt-1 input-field"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 input-field"
                >
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Média</option>
                  <option value="LOW">Baixa</option>
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prazo Final</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 input-field"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Salvando...' : 'Salvar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
