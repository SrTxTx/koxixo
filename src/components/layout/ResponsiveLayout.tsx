'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { Menu, X, Bell, Settings, User, Search, Home, ClipboardList, FileText, Users as UsersIcon, LogOut, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '../ui/ThemeToggle'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface ResponsiveLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
  showSearch?: boolean
}

export function ResponsiveLayout({ 
  children, 
  title, 
  subtitle, 
  actions,
  showSearch = false 
}: ResponsiveLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; at: string; orderId: number }>>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifIndexRef = useRef(0)
  const settingsIndexRef = useRef(0)

  // Fetch notifications periodically
  useEffect(() => {
    let mounted = true
    const fetchNotifs = async () => {
      try {
        const lastSeen = localStorage.getItem('notif:lastSeen')
        const url = new URL('/api/notifications', window.location.origin)
        url.searchParams.set('limit', '20')
        if (lastSeen) url.searchParams.set('since', lastSeen)
        const res = await fetch(url.toString(), { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        const items = (data?.items || []) as Array<{ id: string; message: string; at: string; orderId: number }>
        // Se veio só delta (since), mesclar simples mantendo ordem por data
        setNotifications(prev => {
          const map = new Map<string, { id: string; message: string; at: string; orderId: number }>()
          for (const n of [...items, ...prev]) map.set(n.id, n)
          const merged = Array.from(map.values()).sort((a, b) => (a.at > b.at ? -1 : a.at < b.at ? 1 : 0)).slice(0, 50)
          return merged
        })
        // compute unread based on last seen
        if (lastSeen) {
          const last = new Date(lastSeen).getTime()
          const count = items.filter(n => new Date(n.at).getTime() > last).length
          setUnreadCount(count)
        } else {
          setUnreadCount(items.length)
        }
      } catch (e) {
        // ignore
      }
    }
    fetchNotifs()
    const id = setInterval(fetchNotifs, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (notifOpen && notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false)
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(t)) setSettingsOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [notifOpen, settingsOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Menu Mobile */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 dark:bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Koxixo</h1>
                </div>
              </div>
            </div>

            {/* Busca Central (se habilitada) */}
            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            )}

            {/* Ações do Header */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notificações */}
              <div className="relative" ref={notifRef}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={notifOpen}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const nextOpen = !notifOpen
                    setNotifOpen(nextOpen); 
                    setSettingsOpen(false)
                    if (!notifOpen && notifications.length > 0) {
                      // ao abrir, marcar como visto
                      localStorage.setItem('notif:lastSeen', new Date().toISOString())
                      setUnreadCount(0)
                    }
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden" role="menu" aria-label="Notificações"
                    onKeyDown={(e) => {
                      const max = notifications.length - 1
                      if (['ArrowDown','ArrowUp'].includes(e.key)) e.preventDefault()
                      if (e.key === 'ArrowDown') notifIndexRef.current = Math.min(max, notifIndexRef.current + 1)
                      if (e.key === 'ArrowUp') notifIndexRef.current = Math.max(0, notifIndexRef.current - 1)
                      if (e.key === 'Escape') setNotifOpen(false)
                    }}
                  >
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificações</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300">Últimas atualizações do sistema</p>
                    </div>
                    <ul className="max-h-80 overflow-auto divide-y divide-gray-100 dark:divide-gray-700">
                      {notifications.length === 0 && (
                        <li className="p-3 text-sm text-gray-500 dark:text-gray-400">Sem notificações recentes</li>
                      )}
                      {notifications.map((n, i) => (
                        <li key={n.id} role="menuitem" tabIndex={i === notifIndexRef.current ? 0 : -1}
                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.at).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                      <Link href="/pedidos" className="text-sm text-red-600 dark:text-red-400 inline-flex items-center">Ver pedidos <ChevronRight className="h-4 w-4 ml-1"/></Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Configurações */}
              <div className="relative" ref={settingsRef}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={settingsOpen}
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen((v) => !v); setNotifOpen(false) }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                {settingsOpen && (
                  <div className="absolute right-0 mt-2 w-56 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden" role="menu" aria-label="Configurações"
                    onKeyDown={(e) => {
                      const items = Array.from(e.currentTarget.querySelectorAll('[role="menuitem"]')) as HTMLElement[]
                      const max = items.length - 1
                      const current = settingsIndexRef.current
                      if (['ArrowDown','ArrowUp'].includes(e.key)) e.preventDefault()
                      if (e.key === 'ArrowDown') settingsIndexRef.current = Math.min(max, current + 1)
                      if (e.key === 'ArrowUp') settingsIndexRef.current = Math.max(0, current - 1)
                      if (e.key === 'Escape') setSettingsOpen(false)
                      items[settingsIndexRef.current]?.focus()
                    }}
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Ações</p>
                    </div>
                    <div className="py-1">
                      <Link href="/usuarios" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700" role="menuitem" tabIndex={0}>Perfil/Usuários</Link>
                      <Link href="/preferencias" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700" role="menuitem" tabIndex={-1}>Preferências</Link>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => signOut({ callbackUrl: '/login' })}
                      >
                        Sair
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Perfil */}
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
  <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <nav className="space-y-1">
          <Link href="/dashboard" className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pathname?.startsWith('/dashboard') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`} aria-current={pathname?.startsWith('/dashboard') ? 'page' : undefined}>
            <Home className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
            <span>Dashboard</span>
          </Link>
          <Link href="/pedidos" className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pathname?.startsWith('/pedidos') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`} aria-current={pathname?.startsWith('/pedidos') ? 'page' : undefined}>
            <ClipboardList className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
            <span>Pedidos</span>
          </Link>
          {session?.user?.role === 'ADMIN' && (
            <>
              <Link href="/usuarios" className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pathname?.startsWith('/usuarios') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`} aria-current={pathname?.startsWith('/usuarios') ? 'page' : undefined}>
                <UsersIcon className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                <span>Usuários</span>
              </Link>
              <Link href="/relatorios" className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pathname?.startsWith('/relatorios') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`} aria-current={pathname?.startsWith('/relatorios') ? 'page' : undefined}>
                <FileText className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                <span>Relatórios</span>
              </Link>
            </>
          )}
          <Link href="/estoque" className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${pathname?.startsWith('/estoque') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''}`} aria-current={pathname?.startsWith('/estoque') ? 'page' : undefined}>
            <ClipboardList className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
            <span>Estoque</span>
          </Link>
        </nav>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Home className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                <span>Dashboard</span>
              </Link>
              <Link href="/pedidos" onClick={() => setSidebarOpen(false)} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <ClipboardList className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                <span>Pedidos</span>
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <>
                  <Link href="/usuarios" onClick={() => setSidebarOpen(false)} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <UsersIcon className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                    <span>Usuários</span>
                  </Link>
                  <Link href="/relatorios" onClick={() => setSidebarOpen(false)} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FileText className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                    <span>Relatórios</span>
                  </Link>
                </>
              )}
              <Link href="/estoque" onClick={() => setSidebarOpen(false)} className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <ClipboardList className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-300" />
                <span>Estoque</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="container-responsive py-6 sm:py-8 md:ml-60">
        {/* Cabeçalho da Página */}
        <div className="mb-6 sm:mb-8">
          <div className="flex-responsive justify-between">
            <div>
              <h1 className="heading-1">{title}</h1>
              {subtitle && (
                <p className="text-body mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Busca Mobile (se habilitada) */}
        {showSearch && (
          <div className="md:hidden mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}