'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link href="/dashboard">
            <button className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar para o Dashboard
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Página em construção. Em breve, você poderá visualizar relatórios detalhados aqui.
          </p>
        </header>

        <div className="bg-white p-8 rounded-lg shadow-sm border flex items-center justify-center text-center h-96">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Em Breve</h2>
            <p className="text-gray-500 mt-2">
              Estamos trabalhando para trazer os melhores relatórios para você.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
