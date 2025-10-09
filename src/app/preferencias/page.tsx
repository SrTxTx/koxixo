"use client"

import { useEffect, useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'

// Chave única para guardar preferências localmente
const STORAGE_KEY = 'koxixo:preferences:v1'

type Preferences = {
  appearance: 'light' | 'dark' | 'system'
  density: 'comfortable' | 'compact'
  dateFormat: 'DD/MM/YYYY'
  timeFormat: '24h'
  orders: {
    defaultStatus: string | ''
    defaultPriority: string | ''
    pageSize: 20 | 50
  }
  reports: {
    defaultFields: string[]
    defaultFormat: 'csv' | 'pdf'
  }
  notifications: {
    types: {
      CREATED: boolean
      APPROVED: boolean
      REJECTED: boolean
      IN_PROGRESS: boolean
      COMPLETED: boolean
      DELIVERED: boolean
      UPDATED: boolean
    }
    sound: boolean
  }
}

const DEFAULTS: Preferences = {
  appearance: 'system',
  density: 'comfortable',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  orders: { defaultStatus: '', defaultPriority: '', pageSize: 20 },
  reports: { defaultFields: ['id','title','status','priority','createdAt','createdBy'], defaultFormat: 'csv' },
  notifications: {
    types: { CREATED: true, APPROVED: true, REJECTED: true, IN_PROGRESS: true, COMPLETED: true, DELIVERED: true, UPDATED: true },
    sound: false,
  }
}

export default function PreferenciasPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  // Carregar preferências
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
    setLoading(false)
  }, [])

  // Salvar preferências
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    // Aplicar tema imediatamente
    if (prefs.appearance === 'dark' || (prefs.appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    alert('Preferências salvas!')
  }

  const reset = () => setPrefs(DEFAULTS)

  if (loading) return null

  return (
    <ResponsiveLayout title="Preferências" subtitle="Personalize sua experiência no Koxixo">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aparência */}
        <section className="card">
          <h3 className="heading-3 mb-2">Aparência</h3>
          <p className="text-small mb-4">Tema e densidade visual.</p>
          <div className="space-y-4">
            <div>
              <label className="label">Tema</label>
              <select
                className="input-field"
                value={prefs.appearance}
                onChange={(e) => setPrefs(p => ({ ...p, appearance: e.target.value as Preferences['appearance'] }))}
              >
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
            <div>
              <label className="label">Densidade</label>
              <select
                className="input-field"
                value={prefs.density}
                onChange={(e) => setPrefs(p => ({ ...p, density: e.target.value as Preferences['density'] }))}
              >
                <option value="comfortable">Padrão</option>
                <option value="compact">Compacta</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notificações */}
        <section className="card">
          <h3 className="heading-3 mb-2">Notificações</h3>
          <p className="text-small mb-4">Escolha quais eventos deseja receber.</p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(prefs.notifications.types).map((k) => (
              <label key={k} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(prefs.notifications.types as any)[k]}
                  onChange={(e) => setPrefs(p => ({
                    ...p,
                    notifications: {
                      ...p.notifications,
                      types: { ...(p.notifications.types as any), [k]: e.target.checked }
                    }
                  }))}
                />
                <span className="text-body">{k}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={prefs.notifications.sound}
                onChange={(e) => setPrefs(p => ({ ...p, notifications: { ...p.notifications, sound: e.target.checked } }))}
              />
              <span className="text-body">Som de notificação</span>
            </label>
          </div>
        </section>

        {/* Pedidos */}
        <section className="card">
          <h3 className="heading-3 mb-2">Pedidos</h3>
          <p className="text-small mb-4">Defina valores padrão para a listagem.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status padrão</label>
              <select
                className="input-field"
                value={prefs.orders.defaultStatus}
                onChange={(e) => setPrefs(p => ({ ...p, orders: { ...p.orders, defaultStatus: e.target.value } }))}
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
            <div>
              <label className="label">Prioridade padrão</label>
              <select
                className="input-field"
                value={prefs.orders.defaultPriority}
                onChange={(e) => setPrefs(p => ({ ...p, orders: { ...p.orders, defaultPriority: e.target.value } }))}
              >
                <option value="">Todas</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>
            <div>
              <label className="label">Itens por página</label>
              <select
                className="input-field"
                value={prefs.orders.pageSize}
                onChange={(e) => setPrefs(p => ({ ...p, orders: { ...p.orders, pageSize: Number(e.target.value) as 20 | 50 } }))}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </section>

        {/* Relatórios */}
        <section className="card">
          <h3 className="heading-3 mb-2">Relatórios</h3>
          <p className="text-small mb-4">Campos e formato padrão para exportação.</p>
          <div className="grid grid-cols-2 gap-3">
            {['id','title','status','priority','value','createdAt','dueDate','createdBy'].map((f) => (
              <label key={f} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={prefs.reports.defaultFields.includes(f)}
                  onChange={(e) => setPrefs(p => ({
                    ...p,
                    reports: {
                      ...p.reports,
                      defaultFields: e.target.checked
                        ? [...p.reports.defaultFields, f]
                        : p.reports.defaultFields.filter(x => x !== f)
                    }
                  }))}
                />
                <span className="text-body">{f}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="label">Formato</label>
            <select
              className="input-field"
              value={prefs.reports.defaultFormat}
              onChange={(e) => setPrefs(p => ({ ...p, reports: { ...p.reports, defaultFormat: e.target.value as 'csv' | 'pdf' } }))}
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </section>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn-primary" onClick={save}>Salvar</button>
        <button className="btn-secondary" onClick={reset}>Restaurar padrão</button>
      </div>
    </ResponsiveLayout>
  )
}
