'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { loadServerPreferences, saveServerPreferences } from '@/lib/preferences'
import useSWR from 'swr'
import { PlusCircle, Package, Filter, Search, Eye } from 'lucide-react'
import Link from 'next/link'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { useToast } from '@/components/ui/Toast'

interface Order {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  value: number | null
  createdAt: string
  createdBy: { name: string }
  lastEditedBy?: { name: string }
  lastEditedAt?: string
  rejectionReason?: string
  rejectedAt?: string
  rejectedBy?: { name: string }
}

export default function PedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<'createdAt'|'updatedAt'|'value'|'priority'|'status'|'title'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  // layout global cuida do sidebar/header
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  
  // Estados dos filtros avançados
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dateRange: '',
    createdBy: '',
    searchIn: 'title' // 'title', 'description', 'both'
  })
  const [visibleCols, setVisibleCols] = useState<string[]>(['title','status','priority','createdBy','createdAt'])

  // Aplicar preferências salvas (pageSize, status/priority padrão)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('koxixo:preferences:v1')
      if (raw) {
        const prefs = JSON.parse(raw)
        const ps = Number(prefs?.orders?.pageSize)
        if (ps === 20 || ps === 50) setPageSize(ps)
        if (typeof prefs?.orders?.defaultStatus === 'string') setFilters(f => ({ ...f, status: prefs.orders.defaultStatus }))
        if (typeof prefs?.orders?.defaultPriority === 'string') setFilters(f => ({ ...f, priority: prefs.orders.defaultPriority }))
      }
    } catch {}
    ;(async () => {
      try {
        const server = await loadServerPreferences()
        const o = server?.orders || {}
        if (o.filters) setFilters((f) => ({ ...f, ...o.filters }))
        if (Array.isArray(o.visibleCols)) setVisibleCols(o.visibleCols)
      } catch {}
    })()
  }, [])
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    value: ''
  })

  const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
    if (res.status === 401) {
      router.push('/login')
      return []
    }
    if (!res.ok) throw new Error(`Erro ${res.status}`)
    const total = Number(res.headers.get('X-Total-Count') || '0')
    const data = await res.json()
    ;(data as any)._total = total
    return data
  }

  const buildQuery = () => {
    const sp = new URLSearchParams()
    sp.set('page', String(page))
    sp.set('pageSize', String(pageSize))
    sp.set('sortBy', sortBy)
    sp.set('sortDir', sortDir)
    if (filters.status) sp.set('status', filters.status)
    if (filters.priority) sp.set('priority', filters.priority)
    if (filters.dateRange) sp.set('range', filters.dateRange)
    if (filters.createdBy) sp.set('createdBy', filters.createdBy)
    if (searchTerm) {
      sp.set('search', searchTerm)
      sp.set('searchIn', filters.searchIn)
    }
    return `/api/pedidos?${sp.toString()}`
  }

  const { data, isLoading, mutate } = useSWR<Order[]>(session ? buildQuery() : null, fetcher, { revalidateOnFocus: true, keepPreviousData: true })

  useEffect(() => {
    if (data) {
      const arr = data as unknown as Order[] & { _total?: number }
      setOrders(arr)
      setLoading(false)
    }
  }, [data])

  // Persistir filtros/colunas no servidor (e local) quando mudarem
  useEffect(() => {
    const prefs = { orders: { filters, visibleCols } }
    try { localStorage.setItem('koxixo:prefs:orders', JSON.stringify(prefs.orders)) } catch {}
    saveServerPreferences(prefs)
  }, [filters, visibleCols])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) mutate()
  }, [session, mutate])

  const handleOrderAction = async (orderId: number, action: string, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies de sessão
        body: JSON.stringify({ action, rejectionReason }),
      })

      if (response.ok) {
  await mutate() // Revalida lista
      } else {
        const data = await response.json()
        if (response.status === 401) {
          router.push('/login')
        } else {
          toast.error(data.error || 'Erro ao processar ação', 'Ação nos pedidos')
        }
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error)
      toast.error('Erro de rede', 'Ação nos pedidos')
    }
  }

  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleEditOrder = (order: Order) => {
    lastFocusedRef.current = document.activeElement as HTMLElement
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
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Incluir cookies de sessão
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          value: editForm.value ? parseFloat(editForm.value) : null
        }),
      })

      if (response.ok) {
  await mutate()
        setEditingOrder(null)
        setEditForm({ title: '', description: '', priority: 'MEDIUM', value: '' })
      } else {
        const data = await response.json()
        if (response.status === 401) {
          router.push('/login')
        } else {
          toast.error(data.error || 'Erro ao editar pedido', 'Edição de pedido')
        }
      }
    } catch (error) {
      console.error('Erro ao editar pedido:', error)
      toast.error('Erro de rede', 'Edição de pedido')
    }
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setEditForm({ title: '', description: '', priority: 'MEDIUM', value: '' })
    // restaurar foco no elemento de origem
    setTimeout(() => lastFocusedRef.current?.focus(), 0)
  }

  const getActionButtons = (order: Order) => {
    const userRole = session?.user.role
    const buttons = []

    // Botão "Ver Detalhes" - sempre disponível para todos os usuários
    buttons.push(
      <button
        key="view"
        onClick={() => setViewingOrder(order)}
        className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 rounded border border-red-300 hover:bg-red-50 flex items-center space-x-1 min-w-max"
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
          className="text-green-600 hover:text-green-800 text-sm px-3 py-1.5 rounded border border-green-300 hover:bg-green-50 min-w-max"
        >
          Aprovar
        </button>,
        <button
          key="reject"
          onClick={() => {
            const reason = prompt('Motivo da rejeição:')
            if (reason) handleOrderAction(order.id, 'reject', reason)
          }}
          className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 rounded border border-red-300 hover:bg-red-50 min-w-max"
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
          className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 rounded border border-red-300 hover:bg-red-50 min-w-max"
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
          className="text-green-600 hover:text-green-800 text-sm px-3 py-1.5 rounded border border-green-300 hover:bg-green-50 min-w-max"
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
          className="text-purple-600 hover:text-purple-800 text-sm px-3 py-1.5 rounded border border-purple-300 hover:bg-purple-50 min-w-max"
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
          className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5 rounded border border-red-300 hover:bg-red-50 min-w-max"
        >
          Reenviar para Aprovação
        </button>
      )
    }

    // Botão de editar para ADMIN, VENDEDOR e ORCAMENTO (apenas pedidos PENDING ou REJECTED)
    // Vendedor só pode editar seus próprios pedidos
    if (['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(userRole || '') && 
        ['PENDING', 'REJECTED'].includes(order.status)) {
      
      // Verificar se vendedor pode editar este pedido específico
      const canEdit = userRole === 'ADMIN' || 
                     userRole === 'ORCAMENTO' || 
                     (userRole === 'VENDEDOR' && order.createdBy.name === session?.user.name)
      
      if (canEdit) {
        buttons.push(
          <button
            key="edit"
            onClick={() => handleEditOrder(order)}
            className="text-gray-600 hover:text-gray-800 text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 min-w-max"
          >
            Editar
          </button>
        )
      }
    }

    return buttons
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'APPROVED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'REJECTED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'DELIVERED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
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
      case 'HIGH': return 'text-red-600 dark:text-red-400 font-semibold'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-300 font-medium'
      case 'LOW': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-300'
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

  // Função de filtro avançada
  const getFilteredOrders = () => {
    return orders.filter(order => {
      // Filtro de busca de texto
      let matchesSearch = true
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        switch (filters.searchIn) {
          case 'title':
            matchesSearch = order.title.toLowerCase().includes(searchLower)
            break
          case 'description':
            matchesSearch = order.description?.toLowerCase().includes(searchLower) || false
            break
          case 'both':
            matchesSearch = order.title.toLowerCase().includes(searchLower) || 
                           order.description?.toLowerCase().includes(searchLower) || false
            break
        }
      }

      // Filtro por status
      const matchesStatus = !filters.status || order.status === filters.status

      // Filtro por prioridade
      const matchesPriority = !filters.priority || order.priority === filters.priority

      // Filtro por data
      let matchesDate = true
      if (filters.dateRange) {
        const orderDate = new Date(order.createdAt)
        const now = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            matchesDate = orderDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = orderDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = orderDate >= monthAgo
            break
        }
      }

      // Filtro por criador
      const matchesCreator = !filters.createdBy || 
                           order.createdBy.name.toLowerCase().includes(filters.createdBy.toLowerCase())

      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesCreator
    })
  }

  const filteredOrders = getFilteredOrders()

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      dateRange: '',
      createdBy: '',
      searchIn: 'title'
    })
    setSearchTerm('')
  }

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'title').length + 
                            (searchTerm ? 1 : 0)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const canCreateOrder = session && ['ADMIN', 'VENDEDOR', 'ORCAMENTO'].includes(session.user.role)

  return (
    <ResponsiveLayout title="Gerenciamento de Pedidos">
      <div className="max-w-7xl mx-auto p-4 md:p-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Gerenciamento de Pedidos</h2>
              {canCreateOrder && (
                <Link href="/pedidos/novo">
                  <button className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 transition-colors w-full md:w-auto justify-center">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Novo Pedido
                  </button>
                </Link>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-4 md:space-y-0">
                <div className="relative w-full md:max-w-md">
                  <input
                    type="text"
                    placeholder={
                      filters.searchIn === 'title' ? "Buscar por título..." :
                      filters.searchIn === 'description' ? "Buscar por descrição..." :
                      "Buscar por título ou descrição..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-300" />
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center border px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full md:w-auto justify-center transition-colors ${
                      showFilters ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Painel de filtros */}
              {showFilters && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Filtro por Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        <option value="PENDING">Pendente</option>
                        <option value="APPROVED">Aprovado</option>
                        <option value="REJECTED">Rejeitado</option>
                        <option value="IN_PROGRESS">Em Produção</option>
                        <option value="COMPLETED">Concluído</option>
                        <option value="DELIVERED">Entregue</option>
                      </select>
                    </div>

                    {/* Filtro por Prioridade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                      <select
                        value={filters.priority}
                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">Todas</option>
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Média</option>
                        <option value="LOW">Baixa</option>
                      </select>
                    </div>

                    {/* Filtro por Data */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="">Todos</option>
                        <option value="today">Hoje</option>
                        <option value="week">Última semana</option>
                        <option value="month">Último mês</option>
                      </select>
                    </div>

                    {/* Filtro por Criador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Criado por</label>
                      <input
                        type="text"
                        placeholder="Nome do usuário..."
                        value={filters.createdBy}
                        onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      />
                    </div>

                    {/* Filtro por tipo de busca */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar em</label>
                      <select
                        value={filters.searchIn}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchIn: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="title">Apenas título</option>
                        <option value="description">Apenas descrição</option>
                        <option value="both">Título e descrição</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Resumo dos filtros */}
                  {activeFiltersCount > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{filteredOrders.length}</span> de <span className="font-medium">{orders.length}</span> pedidos encontrados
                        {activeFiltersCount > 0 && (
                          <span className="ml-2 text-red-600 dark:text-red-400">
                            ({activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{order.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      <div>Por: {order.createdBy.name}</div>
                      <div>Data: {new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className={`${getPriorityClass(order.priority)}`}>
                        Prioridade: {getPriorityText(order.priority)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {getActionButtons(order)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('title' as any); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Título {sortBy==='title' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('status'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Status {sortBy==='status' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('priority'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Prioridade {sortBy==='priority' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('createdBy' as any); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Criado por</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('updatedAt'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Editado por</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none" onClick={() => { setSortBy('createdAt'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>Data {sortBy==='createdAt' ? (sortDir==='asc' ? '▲' : '▼') : ''}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-72">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <div className="text-gray-500 dark:text-gray-300">
                              <p className="text-lg font-medium">Nenhum pedido encontrado</p>
                              <p className="text-sm">
                                {activeFiltersCount > 0 
                                  ? 'Tente ajustar os filtros ou limpar a busca'
                                  : 'Ainda não há pedidos cadastrados'
                                }
                              </p>
                            </div>
                            {activeFiltersCount > 0 && (
                              <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Limpar filtros
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {visibleCols.includes('title') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.title}</div>
                            </td>
                          )}
                          {visibleCols.includes('status') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                          )}
                          {visibleCols.includes('priority') && (
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPriorityClass(order.priority)}`}>
                              {getPriorityText(order.priority)}
                            </td>
                          )}
                          {visibleCols.includes('createdBy') && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{order.createdBy.name}</td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {order.lastEditedBy ? order.lastEditedBy.name : '-'}
                          </td>
                          {visibleCols.includes('createdAt') && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          )}
                          <td className="px-6 py-6 text-sm">
                            <div className="flex flex-wrap gap-2 min-w-max">
                              {getActionButtons(order)}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação e PageSize */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Itens por página:</span>
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600">
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}>Anterior</button>
                  <span className="text-sm">Página {page}</span>
                  <button className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600" onClick={() => setPage(p => p+1)}>Próxima</button>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Modal de Detalhes */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-details-title" onKeyDown={(e) => { if (e.key === 'Escape') setViewingOrder(null) }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" tabIndex={-1}>
            <div className="flex justify-between items-start mb-4">
              <h3 id="order-details-title" className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">Detalhes do Pedido #{viewingOrder.id}</h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {viewingOrder.title}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(viewingOrder.status)}`}>
                      {getStatusText(viewingOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                  <div className={`text-sm p-3 rounded-md ${getPriorityClass(viewingOrder.priority)} bg-gray-50 dark:bg-gray-700` }>
                    {getPriorityText(viewingOrder.priority)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {viewingOrder.value ? `R$ ${viewingOrder.value.toFixed(2)}` : 'Não informado'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {viewingOrder.description || 'Nenhuma descrição fornecida'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Criado por</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {viewingOrder.createdBy.name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Editado por</label>
                  <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {viewingOrder.lastEditedBy ? viewingOrder.lastEditedBy.name : 'Nunca editado'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Criação</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  {new Date(viewingOrder.createdAt).toLocaleString('pt-BR')}
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

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
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
                  className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Editar Pedido
                </button>
              )}
            </div>
          </div>
                  {/* Colunas visíveis */}
                  <div className="mt-3">
                    <details>
                      <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">Colunas visíveis</summary>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        {[{k:'title',l:'Título'},{k:'status',l:'Status'},{k:'priority',l:'Prioridade'},{k:'createdBy',l:'Criado por'},{k:'createdAt',l:'Criado em'},{k:'description',l:'Descrição'}].map(c => (
                          <label key={c.k} className="flex items-center gap-2">
                            <input type="checkbox" checked={visibleCols.includes(c.k)} onChange={e => setVisibleCols(v => e.target.checked ? Array.from(new Set([...v, c.k])) : v.filter(x => x !== c.k))} />
                            {c.l}
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-edit-title" onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }}>
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" tabIndex={-1}>
            <h3 id="order-edit-title" className="text-lg font-semibold mb-4">Editar Pedido #{editingOrder.id}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título do Pedido
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-vertical dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Descreva os detalhes do pedido..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.value}
                  onChange={(e) => setEditForm({...editForm, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}
