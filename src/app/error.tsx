'use client'

import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  // Log no cliente ajuda a identificar a causa em produção
  console.error('Erro de aplicação capturado pelo ErrorBoundary:', error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ocorreu um erro na aplicação
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Uma exceção do lado do cliente foi detectada. Você pode tentar novamente ou voltar para a página inicial.
        </p>

        {error?.message && (
          <details className="mb-4 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words">
            <summary className="cursor-pointer select-none mb-2">Detalhes técnicos</summary>
            {error.message}
            {error.digest ? `\nRef: ${error.digest}` : ''}
          </details>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
