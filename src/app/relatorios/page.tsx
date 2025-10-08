'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ResponsiveLayout } from '../../components/layout/ResponsiveLayout'

export default function RelatoriosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <ResponsiveLayout title="Relatórios" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout 
      title="Relatórios" 
      subtitle="Página em construção. Em breve, você poderá visualizar relatórios detalhados aqui."
    >
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center text-center h-96">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Em Breve</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Estamos trabalhando para trazer os melhores relatórios para você.
          </p>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
