'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PlusCircle, Package, Filter, Search, User, LogOut, Menu, BarChart3, Eye } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  value: number | null
  createdAt: string
  createdBy: { name: string }
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: { name: string }
}

export default function PedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    value: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/pedidos')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOrderAction = async (orderId: number, action: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      })

      if (response.ok) {
        await fetchOrders() // Recarrega a lista
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao processar ação')
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error)
      alert('Erro de rede')
    }
  }

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order)
    setEditForm({
      title: order.title,
      description: order.description || '',
      priority: order.priority,
      value: order.value?.toString() || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingOrder) return

    try {
      const response = await fetch(`/api/pedidos/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          value: editForm.value ? parseFloat(editForm.value) : null
        }),
      })

      if (response.ok) {
        await fetchOrders()
        setEditingOrder(null)
        setEditForm({ title: '', description: '', priority: 'MEDIUM', value: '' })
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao editar pedido')
      }
    } catch (error) {
      console.error('Erro ao editar pedido:', error)
      alert('Erro de rede')
    }
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setEditForm({ title: '', description: '', priority: 'MEDIUM', value: '' })
  }

  const getActionButtons = (order: Order) => {
    const userRole = session?.user.role
    const buttons = []

    // Botão "Ver Detalhes" - sempre disponível para todos os usuários
    buttons.push(
      <button
        key="view"
        onClick={() => setViewingOrder(order)}
        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50 flex items-center space-x-1"
      >
        <Eye className="h-3 w-3" />
        <span>Detalhes</span>
      </button>
    )

    // ADMIN pode fazer todas as ações ou ORÇAMENTO pode aprovar/rejeitar pedidos PENDING
    if ((userRole === 'ADMIN' || userRole === 'ORCAMENTO') && order.status === 'PENDING') {
      buttons.push(
        <button
          key="approve"
          onClick={() => handleOrderAction(order.id, 'approve')}
          className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50"
        >
          Aprovar
        </button>,
        <button
          key="reject"
          onClick={() => {
            const reason = prompt('Motivo da rejeição:')
            if (reason) handleOrderAction(order.id, 'reject', reason)
          }}
          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-50"
        >
          Rejeitar
        </button>
      )
    }

    // ADMIN pode fazer todas as ações ou PRODUÇÃO pode iniciar produção
    if ((userRole === 'ADMIN' || userRole === 'PRODUCAO') && order.status === 'APPROVED') {
      buttons.push(
        <button
          key="start"
          onClick={() => handleOrderAction(order.id, 'start_production')}
          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
        >
          Iniciar Produção
        </button>
      )
    }

    // ADMIN pode fazer todas as ações ou PRODUÇÃO pode finalizar produção
    if ((userRole === 'ADMIN' || userRole === 'PRODUCAO') && order.status === 'IN_PROGRESS') {
      buttons.push(
        <button
          key="complete"
          onClick={() => handleOrderAction(order.id, 'complete')}
          className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border border-green-300 hover:bg-green-50"
        >
          Finalizar
        </button>
      )
    }

    // ADMIN pode fazer todas as ações ou VENDEDOR pode marcar como entregue
    if ((userRole === 'ADMIN' || userRole === 'VENDEDOR') && order.status === 'COMPLETED') {
      buttons.push(
        <button
          key="deliver"
          onClick={() => handleOrderAction(order.id, 'deliver')}
          className="text-purple-600 hover:text-purple-800 text-sm px-2 py-1 rounded border border-purple-300 hover:bg-purple-50"
        >
          Marcar Entregue
        </button>
      )
    }

    // Botão de reenviar para aprovação (apenas pedidos REJECTED)
    if (['ADMIN', 'VENDEDOR'].includes(userRole || '') && order.status === 'REJECTED') {
      buttons.push(
        <button
          key="resubmit"
          onClick={() => handleOrderAction(order.id, 'resubmit')}
          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-300 hover:bg-blue-50"
        >
          Reenviar para Aprovação
        </button>
      )
    }

    // Botão de editar para ADMIN, VENDEDOR e ORCAMENTO (apenas pedidos PENDING ou REJECTED)
    if (['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(userRole || '') && 
        ['PENDING', 'REJECTED'].includes(order.status)) {
      buttons.push(
        <button
          key="edit"
          onClick={() => handleEditOrder(order)}
          className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
        >
          Editar
        </button>
      )
    }

    return buttons
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'DELIVERED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente'
      case 'APPROVED': return 'Aprovado'
      case 'REJECTED': return 'Rejeitado'
      case 'IN_PROGRESS': return 'Em Produção'
      case 'COMPLETED': return 'Concluído'
      case 'DELIVERED': return 'Entregue'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 font-semibold'
      case 'MEDIUM': return 'text-yellow-600 font-medium'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Média'
      case 'LOW': return 'Baixa'
      default: return priority
    }
  }

  const filteredOrders = orders.filter(order =>
    order.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const canCreateOrder = session && ['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 ml-2">Koxixo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">{session?.user.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {session?.user.role}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out`}>
          <nav className="mt-8 px-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/pedidos"
              className="flex items-center px-4 py-2 text-gray-900 bg-blue-50 rounded-lg"
            >
              <Package className="h-5 w-5 mr-3" />
              Pedidos
            </Link>
            {session?.user.role === 'ADMIN' && (
              <Link
                href="/usuarios"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <User className="h-5 w-5 mr-3" />
                Usuários
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Gerenciamento de Pedidos</h2>
              {canCreateOrder && (
                <Link href="/pedidos/novo">
                  <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Novo Pedido
                  </button>
                </Link>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <button className="flex items-center text-gray-600 border px-4 py-2 rounded-lg hover:bg-gray-50">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado por</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPriorityClass(order.priority)}`}>
                          {getPriorityText(order.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.createdBy.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-wrap gap-1">
                            {getActionButtons(order)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Modal de Detalhes */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Detalhes do Pedido #{viewingOrder.id}</h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {viewingOrder.title}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(viewingOrder.status)}`}>
                      {getStatusText(viewingOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <div className={`text-sm p-3 rounded-md ${getPriorityClass(viewingOrder.priority)}`}>
                    {getPriorityText(viewingOrder.priority)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {viewingOrder.value ? `R$ ${viewingOrder.value.toFixed(2)}` : 'Não informado'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {viewingOrder.description || 'Nenhuma descrição fornecida'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Criado por</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {viewingOrder.createdBy.name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {new Date(viewingOrder.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {viewingOrder.status === 'REJECTED' && viewingOrder.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-red-700 mb-1">Motivo da Rejeição</label>
                  <div className="text-sm text-red-900 bg-red-50 border border-red-200 p-3 rounded-md">
                    {viewingOrder.rejectionReason}
                  </div>
                  {viewingOrder.rejectedAt && (
                    <div className="text-xs text-red-600 mt-1">
                      Rejeitado em: {new Date(viewingOrder.rejectedAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
              {['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session?.user.role || '') && 
               ['PENDING', 'REJECTED'].includes(viewingOrder.status) && (
                <button
                  onClick={() => {
                    setViewingOrder(null)
                    handleEditOrder(viewingOrder)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Editar Pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Editar Pedido #{editingOrder.id}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Pedido
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  placeholder="Descreva os detalhes do pedido..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.value}
                  onChange={(e) => setEditForm({...editForm, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
