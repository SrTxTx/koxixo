'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Package, CheckCircle, XCircle, Clock, TrendingUp, Users, DollarSign, Calendar, Plus } from 'lucide-react'
import { ResponsiveLayout } from '../../components/layout/ResponsiveLayout'
import { StatCard, InfoCard, GridLayout, ActionCard } from '../../components/ui/Cards'
import { Button, LoadingSpinner } from '../../components/ui/Forms'
import Link from 'next/link'

interface DashboardStats {
  totalOrders: number
  cancelledOrders: number
  approvedOrders: number
  lateOrders: number
  monthlyRevenue?: number
  activeUsers?: number
  completionRate?: number
}

interface RecentOrder {
  id: number
  title: string
  status: string
  createdAt: string
  createdBy: { name: string }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/pedidos?limit=5')
      ])
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        setRecentOrders(ordersData.slice(0, 5))
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { color: 'warning', text: 'Pendente' },
      'APPROVED': { color: 'info', text: 'Aprovado' },
      'REJECTED': { color: 'error', text: 'Rejeitado' },
      'IN_PROGRESS': { color: 'info', text: 'Em Produção' },
      'COMPLETED': { color: 'success', text: 'Concluído' },
      'DELIVERED': { color: 'success', text: 'Entregue' },
      'CANCELLED': { color: 'error', text: 'Cancelado' }
    }
    return statusMap[status as keyof typeof statusMap] || { color: 'neutral', text: status }
  }

  if (status === 'loading' || loading) {
    return (
      <ResponsiveLayout title="Dashboard" subtitle="Carregando dados...">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveLayout>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session.user.role

  return (
    <ResponsiveLayout 
      title={`Bem-vindo, ${session.user.name}!`}
      subtitle="Aqui está um resumo das atividades do sistema"
      actions={
        <Link href="/pedidos/novo">
          <Button icon={Plus}>
            Novo Pedido
          </Button>
        </Link>
      }
    >
      {/* Cards de Estatísticas */}
      <GridLayout cols={4} className="mb-8">
        <StatCard
          title="Total de Pedidos"
          value={stats?.totalOrders || 0}
          change="+12% este mês"
          changeType="positive"
          icon={Package}
          color="red"
          loading={!stats}
        />
        <StatCard
          title="Aprovados"
          value={stats?.approvedOrders || 0}
          change="+8% este mês"
          changeType="positive"
          icon={CheckCircle}
          color="green"
          loading={!stats}
        />
        <StatCard
          title="Pendentes"
          value={stats?.lateOrders || 0}
          change="Aguardando análise"
          changeType="neutral"
          icon={Clock}
          color="yellow"
          loading={!stats}
        />
        <StatCard
          title="Taxa de Conclusão"
          value={stats?.completionRate ? `${stats.completionRate}%` : '85%'}
          change="+3% este mês"
          changeType="positive"
          icon={TrendingUp}
          color="blue"
          loading={!stats}
        />
      </GridLayout>

      <GridLayout cols={3} gap="lg">
        {/* Ações Rápidas */}
        <InfoCard title="Ações Rápidas" icon={TrendingUp}>
          <div className="space-y-3">
            <ActionCard
              title="Novo Pedido"
              description="Criar um novo pedido rapidamente"
              icon={Plus}
              onClick={() => router.push('/pedidos/novo')}
              color="red"
            />
            
            {(userRole === 'ADMIN' || userRole === 'ORCAMENTO') && (
              <ActionCard
                title="Pedidos Pendentes"
                description="Revisar pedidos aguardando aprovação"
                icon={Clock}
                onClick={() => router.push('/pedidos?status=pending')}
                color="yellow"
              />
            )}
            
            {userRole === 'ADMIN' && (
              <ActionCard
                title="Gerenciar Usuários"
                description="Adicionar ou editar usuários"
                icon={Users}
                onClick={() => router.push('/usuarios')}
                color="blue"
              />
            )}
          </div>
        </InfoCard>

        {/* Pedidos Recentes */}
        <InfoCard 
          title="Pedidos Recentes" 
          icon={Package}
          actions={
            <Link href="/pedidos">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          }
          className="col-span-2"
        >
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {order.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Por {order.createdBy.name} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-3">
                      <span className={`badge badge-${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </div>
          )}
        </InfoCard>
      </GridLayout>

      {/* Informações do Usuário */}
      <div className="mt-8">
        <InfoCard title="Informações da Sessão" icon={Users}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-small font-medium text-gray-600">Usuário</p>
              <p className="text-base font-semibold text-gray-900">{session.user.name}</p>
            </div>
            <div>
              <p className="text-small font-medium text-gray-600">Email</p>
              <p className="text-base text-gray-700">{session.user.email}</p>
            </div>
            <div>
              <p className="text-small font-medium text-gray-600">Cargo</p>
              <span className="badge badge-info">{session.user.role}</span>
            </div>
          </div>
        </InfoCard>
      </div>
    </ResponsiveLayout>
  )
}