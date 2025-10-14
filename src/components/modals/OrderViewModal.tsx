// Componente extraído para permitir lazy loading
'use client'

interface OrderViewModalProps {
  order: any
  onClose: () => void
}

export default function OrderViewModal({ order, onClose }: OrderViewModalProps) {
  // TODO: Implementar UI do modal de visualização
  // Por enquanto, retorna um placeholder
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-xl font-semibold mb-4">Visualizar Pedido</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Modal de visualização será implementado aqui
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
