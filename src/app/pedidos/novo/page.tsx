'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NovoPedidoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Dados básicos
  const [clientName, setClientName] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')

  // Tipo de Acabamento
  const [isReto, setIsReto] = useState(false)
  const [isSemiReto, setIsSemiReto] = useState(false)
  const [isComPregas, setIsComPregas] = useState(false)
  const [isViraPau, setIsViraPau] = useState(false)
  const [isIlhos, setIsIlhos] = useState(false)
  const [isIlhosEscondidos, setIsIlhosEscondidos] = useState(false)
  const [isOutroAcabamento, setIsOutroAcabamento] = useState(false)
  const [outroAcabamento, setOutroAcabamento] = useState('')

  // Uso do Tecido
  const [isPorAltura, setIsPorAltura] = useState(false)
  const [isPorMetrosCorridos, setIsPorMetrosCorridos] = useState(false)
  const [isPostico, setIsPostico] = useState(false)
  const [isAbertoAoMeio, setIsAbertoAoMeio] = useState(false)
  const [isEncaparCos, setIsEncaparCos] = useState(false)

  // Observações
  const [observations, setObservations] = useState('')

  // Tipo de Suporte
  const [isTrilho, setIsTrilho] = useState(false)
  const [isTrilhoCurvo, setIsTrilhoCurvo] = useState(false)
  const [isVaraoVazado, setIsVaraoVazado] = useState(false)
  const [isVaraGrossa, setIsVaraGrossa] = useState(false)
  const [isVaraMedia, setIsVaraMedia] = useState(false)
  const [isCromado, setIsCromado] = useState(false)
  const [isAcoEscovado, setIsAcoEscovado] = useState(false)
  const [isPreto, setIsPreto] = useState(false)
  const [isBranco, setIsBranco] = useState(false)
  const [isBege, setIsBege] = useState(false)
  const [isTabaco, setIsTabaco] = useState(false)

  // Instalação
  const [installationStatus, setInstallationStatus] = useState('pendente')

  // Prazo de entrega
  const [dueDate, setDueDate] = useState('')

  // Materiais - simplificado para o formulário
  const [tecidoOrcada, setTecidoOrcada] = useState('')
  const [posticoOrcada, setPosticoOrcada] = useState('')
  const [entrelinhaOrcada, setEntrelinhaOrcada] = useState('')
  const [franzidorOrcada, setFranzidorOrcada] = useState('')
  const [entretelaOrcada, setEntretelaOrcada] = useState('')
  const [ilhosOrcada, setIlhosOrcada] = useState('')
  const [argolasOrcada, setArgolasOrcada] = useState('')
  const [deslizantesOrcada, setDeslizantesOrcada] = useState('')
  const [fitaWaveOrcada, setFitaWaveOrcada] = useState('')
  const [cordaoWaveOrcada, setCordaoWaveOrcada] = useState('')
  const [terminalOrcada, setTerminalOrcada] = useState('')
  const [personalizado1Orcada, setPersonalizado1Orcada] = useState('')
  const [personalizado2Orcada, setPersonalizado2Orcada] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!clientName.trim()) {
      setError('Nome do cliente é obrigatório')
      return
    }

    if (!width || !height) {
      setError('Largura e altura são obrigatórias')
      return
    }

    setLoading(true)

    try {
      const materials = {
        tecido: { orcada: parseFloat(tecidoOrcada) || 0, usada: 0 },
        postico: { orcada: parseFloat(posticoOrcada) || 0, usada: 0 },
        entrelinha: { orcada: parseFloat(entrelinhaOrcada) || 0, usada: 0 },
        franzidor: { orcada: parseFloat(franzidorOrcada) || 0, usada: 0 },
        entretela: { orcada: parseFloat(entretelaOrcada) || 0, usada: 0 },
        ilhos: { orcada: parseFloat(ilhosOrcada) || 0, usada: 0 },
        argolas: { orcada: parseFloat(argolasOrcada) || 0, usada: 0 },
        deslizantes: { orcada: parseFloat(deslizantesOrcada) || 0, usada: 0 },
        fitaWave: { orcada: parseFloat(fitaWaveOrcada) || 0, usada: 0 },
        cordaoWave: { orcada: parseFloat(cordaoWaveOrcada) || 0, usada: 0 },
        terminal: { orcada: parseFloat(terminalOrcada) || 0, usada: 0 },
        personalizado1: { orcada: parseFloat(personalizado1Orcada) || 0, usada: 0 },
        personalizado2: { orcada: parseFloat(personalizado2Orcada) || 0, usada: 0 },
      }

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Pedido - ${clientName}`,
          clientName,
          sellerName: session?.user?.name || '',
          width: parseFloat(width),
          height: parseFloat(height),
          isReto,
          isSemiReto,
          isComPregas,
          isViraPau,
          isIlhos,
          isIlhosEscondidos,
          isOutroAcabamento,
          outroAcabamento,
          isPorAltura,
          isPorMetrosCorridos,
          isPostico,
          isAbertoAoMeio,
          isEncaparCos,
          observations,
          isTrilho,
          isTrilhoCurvo,
          isVaraoVazado,
          isVaraGrossa,
          isVaraMedia,
          isCromado,
          isAcoEscovado,
          isPreto,
          isBranco,
          isBege,
          isTabaco,
          materials,
          installationStatus,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar pedido')
      }

      router.push('/pedidos')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ResponsiveLayout title="Novo Pedido">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/pedidos"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Novo Pedido
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vendedor
                </label>
                <input
                  type="text"
                  value={session?.user?.name || ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Medidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Medidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Largura (metros) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Altura (metros) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tipo de Acabamento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Tipo de Acabamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isReto} onChange={(e) => setIsReto(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Reto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isSemiReto} onChange={(e) => setIsSemiReto(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Semi-reto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isComPregas} onChange={(e) => setIsComPregas(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Com pregas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isViraPau} onChange={(e) => setIsViraPau(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Vira pau</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isIlhos} onChange={(e) => setIsIlhos(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ilhós</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isIlhosEscondidos} onChange={(e) => setIsIlhosEscondidos(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Ilhós escondidos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer col-span-full">
                <input type="checkbox" checked={isOutroAcabamento} onChange={(e) => setIsOutroAcabamento(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Outro:</span>
                <input
                  type="text"
                  value={outroAcabamento}
                  onChange={(e) => setOutroAcabamento(e.target.value)}
                  disabled={!isOutroAcabamento}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  placeholder="Especifique"
                />
              </label>
            </div>
          </div>

          {/* Uso do Tecido */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Uso do Tecido
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPorAltura} onChange={(e) => setIsPorAltura(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Por altura</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPorMetrosCorridos} onChange={(e) => setIsPorMetrosCorridos(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Por metros corridos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPostico} onChange={(e) => setIsPostico(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Postiço</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isAbertoAoMeio} onChange={(e) => setIsAbertoAoMeio(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aberto ao meio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isEncaparCos} onChange={(e) => setIsEncaparCos(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Encapar a cós</span>
              </label>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Observações
            </h2>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Observações adicionais (opcional)"
            />
          </div>

          {/* Tipo de Suporte */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Tipo de Suporte
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isTrilho} onChange={(e) => setIsTrilho(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Trilho</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isTrilhoCurvo} onChange={(e) => setIsTrilhoCurvo(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">T. Curvo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isVaraoVazado} onChange={(e) => setIsVaraoVazado(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Varão vazado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isVaraGrossa} onChange={(e) => setIsVaraGrossa(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Vara grossa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isVaraMedia} onChange={(e) => setIsVaraMedia(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Vara média</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isCromado} onChange={(e) => setIsCromado(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cromado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isAcoEscovado} onChange={(e) => setIsAcoEscovado(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aço escovado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPreto} onChange={(e) => setIsPreto(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Preto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isBranco} onChange={(e) => setIsBranco(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Branco</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isBege} onChange={(e) => setIsBege(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bege</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isTabaco} onChange={(e) => setIsTabaco(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Tabaco</span>
              </label>
            </div>
          </div>

          {/* Materiais - Versão Simplificada */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Materiais (Quantidade Orçada)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Tecido', value: tecidoOrcada, setter: setTecidoOrcada },
                { label: 'Postiço', value: posticoOrcada, setter: setPosticoOrcada },
                { label: 'Entrelinha', value: entrelinhaOrcada, setter: setEntrelinhaOrcada },
                { label: 'Franzidor', value: franzidorOrcada, setter: setFranzidorOrcada },
                { label: 'Entretela', value: entretelaOrcada, setter: setEntretelaOrcada },
                { label: 'Ilhós', value: ilhosOrcada, setter: setIlhosOrcada },
                { label: 'Argolas', value: argolasOrcada, setter: setArgolasOrcada },
                { label: 'Deslizantes', value: deslizantesOrcada, setter: setDeslizantesOrcada },
                { label: 'Fita Wave', value: fitaWaveOrcada, setter: setFitaWaveOrcada },
                { label: 'Cordão Wave', value: cordaoWaveOrcada, setter: setCordaoWaveOrcada },
                { label: 'Terminal', value: terminalOrcada, setter: setTerminalOrcada },
                { label: 'Personalizado 1', value: personalizado1Orcada, setter: setPersonalizado1Orcada },
                { label: 'Personalizado 2', value: personalizado2Orcada, setter: setPersonalizado2Orcada },
              ].map((material) => (
                <div key={material.label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {material.label}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={material.value}
                    onChange={(e) => material.setter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              * As quantidades usadas serão preenchidas pela equipe de produção
            </p>
          </div>

          {/* Instalação e Prazo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Instalação e Prazo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instalação
                </label>
                <select
                  value={installationStatus}
                  onChange={(e) => setInstallationStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="pendente">Pendente</option>
                  <option value="sim">Sim</option>
                  <option value="nao">Não</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo de Entrega
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              * O nome da costureira será preenchido pela equipe de produção
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link
              href="/pedidos"
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveLayout>
  )
}
