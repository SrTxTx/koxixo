'use client'

import { ReactNode, useState } from 'react'
import { Menu, X, Bell, Settings, User, Search } from 'lucide-react'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Menu Mobile */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900">Koxixo</h1>
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
              {/* Notificações */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Configurações */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>

              {/* Perfil */}
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Conteúdo do menu mobile seria inserido aqui */}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="container-responsive py-6 sm:py-8">
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