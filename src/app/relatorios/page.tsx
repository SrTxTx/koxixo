'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveLayout } from '../../components/layout/ResponsiveLayout'
import { InfoCard, StatCard } from '../../components/ui/Cards'
import { BarChart2, DollarSign, ListOrdered, Users } from 'lucide-react'

type SummaryResponse = {
  totals: { totalOrders: number; totalValue: number }
  byStatus: { status: string; count: number }[]
  byPriority: { priority: string; count: number }[]
  byDay: { date: string; count: number }[]
  topCreators: { id: number | null; name: string; count: number }[]
}

export default function RelatoriosPage() {
  const { status } = useSession()
  const router = useRouter()

  const [filters, setFilters] = useState({
    range: 'month', // today | week | month
    status: '',
    priority: '',
    createdBy: ''
  })
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [exportFields, setExportFields] = useState<string[]>([
    'id','title','status','priority','value','createdAt','createdBy'
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (filters.range) params.set('range', filters.range)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.createdBy) params.set('createdBy', filters.createdBy)
    return params.toString()
  }, [filters])

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/relatorios/summary?${queryString}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const json = (await res.json()) as SummaryResponse
        if (!ignore) setData(json)
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Erro ao carregar dados')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [queryString])

  if (status === 'loading') {
    return (
      <ResponsiveLayout title="Relatórios" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.range) params.set('range', filters.range)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.createdBy) params.set('createdBy', filters.createdBy)
    params.set('format', exportFormat)
    params.set('fields', exportFields.join(','))
    const url = `/api/relatorios/export?${params.toString()}`
    // open in same tab to trigger download
    window.location.href = url
  }

  return (
    <ResponsiveLayout 
      title="Relatórios" 
      subtitle="Resumo de pedidos por período, status e prioridade"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100"
            aria-label="Formato de exportação"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button
            onClick={handleExport}
            className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 transition-colors"
          >
            Exportar
          </button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Período</label>
            <select
              value={filters.range}
              onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="IN_PROGRESS">Em Produção</option>
              <option value="COMPLETED">Concluído</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Todas</option>
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Média</option>
              <option value="LOW">Baixa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Criado por</label>
            <input
              type="text"
              value={filters.createdBy}
              onChange={(e) => setFilters((f) => ({ ...f, createdBy: e.target.value }))}
              placeholder="Nome do usuário..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>
        </div>
        {/* Campos para exportação */}
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Campos para exportação</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { key: 'id', label: 'ID' },
              { key: 'title', label: 'Título' },
              { key: 'description', label: 'Descrição' },
              { key: 'status', label: 'Status' },
              { key: 'priority', label: 'Prioridade' },
              { key: 'value', label: 'Valor' },
              { key: 'createdAt', label: 'Data de Criação' },
              { key: 'dueDate', label: 'Prazo' },
              { key: 'createdBy', label: 'Criado por' },
              { key: 'lastEditedBy', label: 'Editado por' },
              { key: 'approvedBy', label: 'Aprovado por' },
              { key: 'rejectedBy', label: 'Rejeitado por' },
              { key: 'rejectionReason', label: 'Motivo rejeição' },
              { key: 'completedAt', label: 'Concluído em' },
              { key: 'deliveredAt', label: 'Entregue em' },
            ].map(({ key, label }) => {
              const checked = exportFields.includes(key)
              return (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setExportFields((prev) => e.target.checked ? [...prev, key] : prev.filter((f) => f !== key))}
                    className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500"
                  />
                  {label}
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total de Pedidos" value={data?.totals.totalOrders ?? 0} icon={ListOrdered} color="blue" loading={loading} />
        <StatCard title="Valor Total (R$)" value={(data?.totals.totalValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} icon={DollarSign} color="green" loading={loading} />
        <StatCard title="Status distintos" value={data?.byStatus.length ?? 0} icon={BarChart2} color="purple" loading={loading} />
        <StatCard title="Top Criadores" value={data?.topCreators.length ?? 0} icon={Users} color="yellow" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Pedidos por Status">
          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <ul className="space-y-2">
              {(data?.byStatus || []).map((s) => (
                <li key={s.status} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{s.status}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.count}</span>
                </li>
              ))}
              {data && data.byStatus.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300">Sem dados para os filtros selecionados.</p>
              )}
            </ul>
          )}
        </InfoCard>

        <InfoCard title="Pedidos por Prioridade">
          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <ul className="space-y-2">
              {(data?.byPriority || []).map((p) => (
                <li key={p.priority} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{p.priority}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.count}</span>
                </li>
              ))}
              {data && data.byPriority.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300">Sem dados para os filtros selecionados.</p>
              )}
            </ul>
          )}
        </InfoCard>

        <InfoCard title="Top Criadores (Top 10)">
          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <ul className="space-y-2">
              {(data?.topCreators || []).map((c) => (
                <li key={`${c.id}-${c.name}`} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{c.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.count}</span>
                </li>
              ))}
              {data && data.topCreators.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300">Sem dados para os filtros selecionados.</p>
              )}
            </ul>
          )}
        </InfoCard>

        <InfoCard title="Pedidos por Dia (últimos 30 dias ou intervalo)">
          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : (
            <ul className="space-y-2">
              {(data?.byDay || []).map((d) => (
                <li key={d.date} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-700 dark:text-gray-200">{new Date(d.date).toLocaleDateString()}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.count}</span>
                </li>
              ))}
              {data && data.byDay.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-300">Sem dados para os filtros selecionados.</p>
              )}
            </ul>
          )}
        </InfoCard>
      </div>
    </ResponsiveLayout>
  )
}
