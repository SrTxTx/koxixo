'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { loadServerPreferences, saveServerPreferences } from '@/lib/preferences'
import useSWR from 'swr'
import { swrDefaultConfig } from '@/lib/swr-config'
import { useDebounce } from '@/lib/hooks/useDebounce'
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
  // Novos campos de cortinas
  clientName?: string
  sellerName?: string
  width?: number
  height?: number
  isReto?: boolean
  isSemiReto?: boolean
  isComPregas?: boolean
  isViraPau?: boolean
  isIlhos?: boolean
  isIlhosEscondidos?: boolean
  isOutroAcabamento?: boolean
  outroAcabamento?: string
  isPorAltura?: boolean
  isPorMetrosCorridos?: boolean
  isPostico?: boolean
  isAbertoAoMeio?: boolean
  isEncaparCos?: boolean
  observations?: string
  isTrilho?: boolean
  isTrilhoCurvo?: boolean
  isVaraoVazado?: boolean
  isVaraGrossa?: boolean
  isVaraMedia?: boolean
  isCromado?: boolean
  isAcoEscovado?: boolean
  isPreto?: boolean
  isBranco?: boolean
  isBege?: boolean
  isTabaco?: boolean
  materials?: any
  installationStatus?: string
  seamstressName?: string
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
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
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
    value: '',
    // Campos de cortinas
    clientName: '',
    sellerName: '',
    width: '',
    height: '',
    isReto: false,
    isSemiReto: false,
    isComPregas: false,
    isViraPau: false,
    isIlhos: false,
    isIlhosEscondidos: false,
    isOutroAcabamento: false,
    outroAcabamento: '',
    isPorAltura: false,
    isPorMetrosCorridos: false,
    isPostico: false,
    isAbertoAoMeio: false,
    isEncaparCos: false,
    observations: '',
    isTrilho: false,
    isTrilhoCurvo: false,
    isVaraoVazado: false,
    isVaraGrossa: false,
    isVaraMedia: false,
    isCromado: false,
    isAcoEscovado: false,
    isPreto: false,
    isBranco: false,
    isBege: false,
    isTabaco: false,
    materials: {},
    installationStatus: '',
    seamstressName: ''
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
    if (debouncedSearchTerm) {
      sp.set('search', debouncedSearchTerm)
      sp.set('searchIn', filters.searchIn)
    }
    return `/api/pedidos?${sp.toString()}`
  }

  const { data, isLoading, mutate } = useSWR<Order[]>(session ? buildQuery() : null, fetcher, swrDefaultConfig)

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
    console.log('handleOrderAction chamada:', { orderId, action, rejectionReason })
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
        toast.success('Ação executada com sucesso!', 'Pedidos')
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
    console.log('handleEditOrder chamada:', order.id)
    lastFocusedRef.current = document.activeElement as HTMLElement
    setEditingOrder(order)
    setEditForm({
      title: order.title,
      description: order.description || '',
      priority: order.priority,
      value: order.value?.toString() || '',
      // Campos de cortinas
      clientName: order.clientName || '',
      sellerName: order.sellerName || '',
      width: order.width?.toString() || '',
      height: order.height?.toString() || '',
      isReto: order.isReto || false,
      isSemiReto: order.isSemiReto || false,
      isComPregas: order.isComPregas || false,
      isViraPau: order.isViraPau || false,
      isIlhos: order.isIlhos || false,
      isIlhosEscondidos: order.isIlhosEscondidos || false,
      isOutroAcabamento: order.isOutroAcabamento || false,
      outroAcabamento: order.outroAcabamento || '',
      isPorAltura: order.isPorAltura || false,
      isPorMetrosCorridos: order.isPorMetrosCorridos || false,
      isPostico: order.isPostico || false,
      isAbertoAoMeio: order.isAbertoAoMeio || false,
      isEncaparCos: order.isEncaparCos || false,
      observations: order.observations || '',
      isTrilho: order.isTrilho || false,
      isTrilhoCurvo: order.isTrilhoCurvo || false,
      isVaraoVazado: order.isVaraoVazado || false,
      isVaraGrossa: order.isVaraGrossa || false,
      isVaraMedia: order.isVaraMedia || false,
      isCromado: order.isCromado || false,
      isAcoEscovado: order.isAcoEscovado || false,
      isPreto: order.isPreto || false,
      isBranco: order.isBranco || false,
      isBege: order.isBege || false,
      isTabaco: order.isTabaco || false,
      materials: order.materials || {},
      installationStatus: order.installationStatus || '',
      seamstressName: order.seamstressName || ''
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
          value: editForm.value ? parseFloat(editForm.value) : null,
          // Campos de cortinas
          clientName: editForm.clientName || null,
          sellerName: editForm.sellerName || null,
          width: editForm.width ? parseFloat(editForm.width) : null,
          height: editForm.height ? parseFloat(editForm.height) : null,
          isReto: editForm.isReto,
          isSemiReto: editForm.isSemiReto,
          isComPregas: editForm.isComPregas,
          isViraPau: editForm.isViraPau,
          isIlhos: editForm.isIlhos,
          isIlhosEscondidos: editForm.isIlhosEscondidos,
          isOutroAcabamento: editForm.isOutroAcabamento,
          outroAcabamento: editForm.outroAcabamento || null,
          isPorAltura: editForm.isPorAltura,
          isPorMetrosCorridos: editForm.isPorMetrosCorridos,
          isPostico: editForm.isPostico,
          isAbertoAoMeio: editForm.isAbertoAoMeio,
          isEncaparCos: editForm.isEncaparCos,
          observations: editForm.observations || null,
          isTrilho: editForm.isTrilho,
          isTrilhoCurvo: editForm.isTrilhoCurvo,
          isVaraoVazado: editForm.isVaraoVazado,
          isVaraGrossa: editForm.isVaraGrossa,
          isVaraMedia: editForm.isVaraMedia,
          isCromado: editForm.isCromado,
          isAcoEscovado: editForm.isAcoEscovado,
          isPreto: editForm.isPreto,
          isBranco: editForm.isBranco,
          isBege: editForm.isBege,
          isTabaco: editForm.isTabaco,
          materials: editForm.materials,
          installationStatus: editForm.installationStatus || null,
          seamstressName: editForm.seamstressName || null
        }),
      })

      if (response.ok) {
  await mutate()
        setEditingOrder(null)
        // Reset completo do formulário
        setEditForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          value: '',
          clientName: '',
          sellerName: '',
          width: '',
          height: '',
          isReto: false,
          isSemiReto: false,
          isComPregas: false,
          isViraPau: false,
          isIlhos: false,
          isIlhosEscondidos: false,
          isOutroAcabamento: false,
          outroAcabamento: '',
          isPorAltura: false,
          isPorMetrosCorridos: false,
          isPostico: false,
          isAbertoAoMeio: false,
          isEncaparCos: false,
          observations: '',
          isTrilho: false,
          isTrilhoCurvo: false,
          isVaraoVazado: false,
          isVaraGrossa: false,
          isVaraMedia: false,
          isCromado: false,
          isAcoEscovado: false,
          isPreto: false,
          isBranco: false,
          isBege: false,
          isTabaco: false,
          materials: {},
          installationStatus: '',
          seamstressName: ''
        })
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
    const buttons: JSX.Element[] = []

    // Botão "Ver Detalhes" - sempre disponível para todos os usuários
    buttons.push(
      <button
        key="view"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Botão Detalhes clicado:', order.id)
          setViewingOrder(order)
        }}
        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium px-2.5 py-1.5 rounded border border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
      >
        <Eye className="h-3.5 w-3.5" />
        <span>Detalhes</span>
      </button>
    )

    // ADMIN pode fazer todas as ações ou ORÇAMENTO pode aprovar/rejeitar pedidos PENDING
    if ((userRole === 'ADMIN' || userRole === 'ORCAMENTO') && order.status === 'PENDING') {
      buttons.push(
        <button
          key="approve"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Aprovar clicado:', order.id)
            handleOrderAction(order.id, 'approve')
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-green-300 text-green-600 hover:text-green-800 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20 whitespace-nowrap"
        >
          Aprovar
        </button>
      )
      buttons.push(
        <button
          key="reject"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Rejeitar clicado:', order.id)
            const reason = prompt('Motivo da rejeição:')
            if (reason) handleOrderAction(order.id, 'reject', reason)
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-red-300 text-red-600 hover:text-red-800 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Iniciar Produção clicado:', order.id)
            handleOrderAction(order.id, 'start_production')
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-blue-300 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20 whitespace-nowrap"
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Finalizar clicado:', order.id)
            handleOrderAction(order.id, 'complete')
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-green-300 text-green-600 hover:text-green-800 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-900/20 whitespace-nowrap"
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Marcar Entregue clicado:', order.id)
            handleOrderAction(order.id, 'deliver')
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-purple-300 text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20 whitespace-nowrap"
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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Botão Reenviar clicado:', order.id)
            handleOrderAction(order.id, 'resubmit')
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded border border-yellow-300 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:border-yellow-700 dark:hover:bg-yellow-900/20 whitespace-nowrap"
        >
          Reenviar
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Botão Editar clicado:', order.id)
              handleEditOrder(order)
            }}
            className="text-xs font-medium px-2.5 py-1.5 rounded border border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 whitespace-nowrap"
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
      <div className="space-y-6">
        {/* Header com título e botão Novo Pedido */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
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

        {/* Card principal com filtros e tabela */}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[280px]">Ações</th>
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
                          <td className="px-4 py-4 text-sm">
                            <div className="flex flex-wrap gap-1.5 items-center justify-start">
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

      {/* Modal de Detalhes */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="order-details-title" onKeyDown={(e) => { if (e.key === 'Escape') setViewingOrder(null) }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" tabIndex={-1}>
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
            
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Informações Básicas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.title}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(viewingOrder.status)}`}>
                      {getStatusText(viewingOrder.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prioridade</label>
                    <div className={`text-sm ${getPriorityClass(viewingOrder.priority)}`}>
                      {getPriorityText(viewingOrder.priority)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {viewingOrder.value ? `R$ ${viewingOrder.value.toFixed(2)}` : 'Não informado'}
                    </div>
                  </div>
                </div>
                {viewingOrder.description && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{viewingOrder.description}</div>
                  </div>
                )}
              </div>

              {/* Cliente e Vendedor */}
              {(viewingOrder.clientName || viewingOrder.sellerName) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Cliente e Vendedor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingOrder.clientName && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cliente</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.clientName}</div>
                      </div>
                    )}
                    {viewingOrder.sellerName && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vendedor</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.sellerName}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medidas */}
              {(viewingOrder.width || viewingOrder.height) && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Medidas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {viewingOrder.width && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Largura</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.width}m</div>
                      </div>
                    )}
                    {viewingOrder.height && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Altura</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.height}m</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Acabamento */}
              {(viewingOrder.isReto || viewingOrder.isSemiReto || viewingOrder.isComPregas || 
                viewingOrder.isViraPau || viewingOrder.isIlhos || viewingOrder.isIlhosEscondidos || 
                viewingOrder.isOutroAcabamento) && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Tipo de Acabamento</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingOrder.isReto && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Reto</span>}
                    {viewingOrder.isSemiReto && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Semi-Reto</span>}
                    {viewingOrder.isComPregas && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Com Pregas</span>}
                    {viewingOrder.isViraPau && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Vira Pau</span>}
                    {viewingOrder.isIlhos && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Ilhós</span>}
                    {viewingOrder.isIlhosEscondidos && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">Ilhós Escondidos</span>}
                    {viewingOrder.isOutroAcabamento && <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs rounded-full">{viewingOrder.outroAcabamento || 'Outro'}</span>}
                  </div>
                </div>
              )}

              {/* Uso do Tecido */}
              {(viewingOrder.isPorAltura || viewingOrder.isPorMetrosCorridos || viewingOrder.isPostico || 
                viewingOrder.isAbertoAoMeio || viewingOrder.isEncaparCos) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Uso do Tecido</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingOrder.isPorAltura && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">Por Altura</span>}
                    {viewingOrder.isPorMetrosCorridos && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">Por Metros Corridos</span>}
                    {viewingOrder.isPostico && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">Póstico</span>}
                    {viewingOrder.isAbertoAoMeio && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">Aberto ao Meio</span>}
                    {viewingOrder.isEncaparCos && <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">Encapar Cos</span>}
                  </div>
                </div>
              )}

              {/* Observações */}
              {viewingOrder.observations && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Observações</h4>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {viewingOrder.observations}
                  </div>
                </div>
              )}

              {/* Tipo de Suporte e Cores */}
              {(viewingOrder.isTrilho || viewingOrder.isTrilhoCurvo || viewingOrder.isVaraoVazado || 
                viewingOrder.isVaraGrossa || viewingOrder.isVaraMedia || viewingOrder.isCromado || 
                viewingOrder.isAcoEscovado || viewingOrder.isPreto || viewingOrder.isBranco || 
                viewingOrder.isBege || viewingOrder.isTabaco) && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Tipo de Suporte e Cores</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo de Suporte</label>
                      <div className="flex flex-wrap gap-2">
                        {viewingOrder.isTrilho && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 text-xs rounded-full">Trilho</span>}
                        {viewingOrder.isTrilhoCurvo && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 text-xs rounded-full">Trilho Curvo</span>}
                        {viewingOrder.isVaraoVazado && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 text-xs rounded-full">Varão Vazado</span>}
                        {viewingOrder.isVaraGrossa && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 text-xs rounded-full">Vara Grossa</span>}
                        {viewingOrder.isVaraMedia && <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-100 text-xs rounded-full">Vara Média</span>}
                      </div>
                    </div>
                    {(viewingOrder.isCromado || viewingOrder.isAcoEscovado || viewingOrder.isPreto || 
                      viewingOrder.isBranco || viewingOrder.isBege || viewingOrder.isTabaco) && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cores</label>
                        <div className="flex flex-wrap gap-2">
                          {viewingOrder.isCromado && <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs rounded-full">Cromado</span>}
                          {viewingOrder.isAcoEscovado && <span className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 text-xs rounded-full">Aço Escovado</span>}
                          {viewingOrder.isPreto && <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">Preto</span>}
                          {viewingOrder.isBranco && <span className="px-3 py-1 bg-white dark:bg-gray-200 text-gray-800 border border-gray-300 text-xs rounded-full">Branco</span>}
                          {viewingOrder.isBege && <span className="px-3 py-1 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100 text-xs rounded-full">Bege</span>}
                          {viewingOrder.isTabaco && <span className="px-3 py-1 bg-amber-700 text-white text-xs rounded-full">Tabaco</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Materiais */}
              {viewingOrder.materials && (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Materiais</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-teal-100 dark:bg-teal-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200">Material</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200">Qtd. Orçada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {viewingOrder.materials.entrelela?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Entrelela</td><td className="px-3 py-2 text-center">{viewingOrder.materials.entrelela.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.franzidor?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Franzidor</td><td className="px-3 py-2 text-center">{viewingOrder.materials.franzidor.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.ganchosPlastico?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Ganchos de Plástico</td><td className="px-3 py-2 text-center">{viewingOrder.materials.ganchosPlastico.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.ganchosMetal?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Ganchos de Metal</td><td className="px-3 py-2 text-center">{viewingOrder.materials.ganchosMetal.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.linha?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Linha</td><td className="px-3 py-2 text-center">{viewingOrder.materials.linha.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.argolasPlastico?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Argolas de Plástico</td><td className="px-3 py-2 text-center">{viewingOrder.materials.argolasPlastico.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.argolasMetal?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Argolas de Metal</td><td className="px-3 py-2 text-center">{viewingOrder.materials.argolasMetal.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.cinta?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Cinta</td><td className="px-3 py-2 text-center">{viewingOrder.materials.cinta.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.barraChumbada?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Barra Chumbada</td><td className="px-3 py-2 text-center">{viewingOrder.materials.barraChumbada.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.ilhos?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Ilhós</td><td className="px-3 py-2 text-center">{viewingOrder.materials.ilhos.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.velcro?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Velcro</td><td className="px-3 py-2 text-center">{viewingOrder.materials.velcro.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.imaMaoFrancesa?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Imã Mão Francesa</td><td className="px-3 py-2 text-center">{viewingOrder.materials.imaMaoFrancesa.orcada}</td></tr>
                        )}
                        {viewingOrder.materials.outros?.orcada > 0 && (
                          <tr><td className="px-3 py-2">Outros</td><td className="px-3 py-2 text-center">{viewingOrder.materials.outros.orcada}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Instalação */}
              {(viewingOrder.installationStatus || viewingOrder.seamstressName) && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Instalação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingOrder.installationStatus && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status da Instalação</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.installationStatus}</div>
                      </div>
                    )}
                    {viewingOrder.seamstressName && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Costureira</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.seamstressName}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações do Sistema */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Informações do Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Criado por</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.createdBy.name}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data de Criação</label>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(viewingOrder.createdAt).toLocaleString('pt-BR')}</div>
                  </div>
                  {viewingOrder.lastEditedBy && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Editado por</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.lastEditedBy.name}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data da Edição</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100">{viewingOrder.lastEditedAt ? new Date(viewingOrder.lastEditedAt).toLocaleString('pt-BR') : '-'}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rejeição */}
              {viewingOrder.status === 'REJECTED' && viewingOrder.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                  <h4 className="text-md font-semibold text-red-800 dark:text-red-300 mb-2">Motivo da Rejeição</h4>
                  <div className="text-sm text-red-900 dark:text-red-200">{viewingOrder.rejectionReason}</div>
                  {viewingOrder.rejectedAt && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Rejeitado em: {new Date(viewingOrder.rejectedAt).toLocaleString('pt-BR')}
                      {viewingOrder.rejectedBy && ` por ${viewingOrder.rejectedBy.name}`}
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
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" tabIndex={-1}>
            <h3 id="order-edit-title" className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Editar Pedido #{editingOrder.id}</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1 - Informações Básicas e Cliente */}
              <div className="space-y-4">
                {/* Informações Básicas */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Informações Básicas</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título do Pedido</label>
                      <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                      <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-vertical dark:bg-gray-700 dark:text-gray-100"
                        placeholder="Descreva os detalhes do pedido..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
                        <select value={editForm.priority} onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100">
                          <option value="LOW">Baixa</option>
                          <option value="MEDIUM">Média</option>
                          <option value="HIGH">Alta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                        <input type="number" step="0.01" value={editForm.value} onChange={(e) => setEditForm({...editForm, value: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cliente e Vendedor */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Cliente e Vendedor</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente</label>
                      <input type="text" value={editForm.clientName} onChange={(e) => setEditForm({...editForm, clientName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Vendedor</label>
                      <input type="text" value={editForm.sellerName} onChange={(e) => setEditForm({...editForm, sellerName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                  </div>
                </div>

                {/* Medidas */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Medidas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Largura (m)</label>
                      <input type="number" step="0.01" value={editForm.width} onChange={(e) => setEditForm({...editForm, width: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (m)</label>
                      <input type="number" step="0.01" value={editForm.height} onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                  </div>
                </div>

                {/* Acabamento */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Tipo de Acabamento</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'isReto', label: 'Reto' },
                      { key: 'isSemiReto', label: 'Semi-Reto' },
                      { key: 'isComPregas', label: 'Com Pregas' },
                      { key: 'isViraPau', label: 'Vira Pau' },
                      { key: 'isIlhos', label: 'Ilhós' },
                      { key: 'isIlhosEscondidos', label: 'Ilhós Escondidos' },
                      { key: 'isOutroAcabamento', label: 'Outro' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editForm[item.key as keyof typeof editForm] as boolean}
                          onChange={(e) => setEditForm({...editForm, [item.key]: e.target.checked})}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                    {editForm.isOutroAcabamento && (
                      <input type="text" value={editForm.outroAcabamento} onChange={(e) => setEditForm({...editForm, outroAcabamento: e.target.value})}
                        placeholder="Especifique outro acabamento"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100 text-sm" />
                    )}
                  </div>
                </div>

                {/* Instalação */}
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Instalação</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status da Instalação</label>
                      <input type="text" value={editForm.installationStatus} onChange={(e) => setEditForm({...editForm, installationStatus: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Costureira</label>
                      <input type="text" value={editForm.seamstressName} onChange={(e) => setEditForm({...editForm, seamstressName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2 - Uso do Tecido, Suporte e Observações */}
              <div className="space-y-4">
                {/* Uso do Tecido */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Uso do Tecido</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'isPorAltura', label: 'Por Altura' },
                      { key: 'isPorMetrosCorridos', label: 'Por Metros Corridos' },
                      { key: 'isPostico', label: 'Póstico' },
                      { key: 'isAbertoAoMeio', label: 'Aberto ao Meio' },
                      { key: 'isEncaparCos', label: 'Encapar Cos' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editForm[item.key as keyof typeof editForm] as boolean}
                          onChange={(e) => setEditForm({...editForm, [item.key]: e.target.checked})}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tipo de Suporte */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Tipo de Suporte</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'isTrilho', label: 'Trilho' },
                      { key: 'isTrilhoCurvo', label: 'Trilho Curvo' },
                      { key: 'isVaraoVazado', label: 'Varão Vazado' },
                      { key: 'isVaraGrossa', label: 'Vara Grossa' },
                      { key: 'isVaraMedia', label: 'Vara Média' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editForm[item.key as keyof typeof editForm] as boolean}
                          onChange={(e) => setEditForm({...editForm, [item.key]: e.target.checked})}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cores */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Cores</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'isCromado', label: 'Cromado' },
                      { key: 'isAcoEscovado', label: 'Aço Escovado' },
                      { key: 'isPreto', label: 'Preto' },
                      { key: 'isBranco', label: 'Branco' },
                      { key: 'isBege', label: 'Bege' },
                      { key: 'isTabaco', label: 'Tabaco' }
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editForm[item.key as keyof typeof editForm] as boolean}
                          onChange={(e) => setEditForm({...editForm, [item.key]: e.target.checked})}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Observações</h4>
                  <textarea rows={4} value={editForm.observations} onChange={(e) => setEditForm({...editForm, observations: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-vertical dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Observações adicionais sobre o pedido..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={handleCancelEdit}
                className="px-6 py-2.5 text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">
                Cancelar
              </button>
              <button onClick={handleSaveEdit}
                className="px-6 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}
