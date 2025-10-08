'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PlusCircle, User, Edit, Trash2, Eye, EyeOff, Search, UserPlus } from 'lucide-react'
import { ResponsiveLayout } from '../../components/layout/ResponsiveLayout'
import { InfoCard, ActionCard } from '../../components/ui/Cards'
import { Button, Input, Select, Alert, LoadingSpinner } from '../../components/ui/Forms'

interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

export default function UsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'VENDEDOR',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, router, session])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Erro:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingUser ? 'Usuário atualizado!' : 'Usuário criado!' 
        })
        resetForm()
        fetchUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Erro ao salvar usuário' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar usuário' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (response.ok) {
        setMessage({ type: 'success', text: 'Usuário excluído!' })
        fetchUsers()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Erro ao excluir usuário' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir usuário' })
    }
  }

  const resetForm = () => {
    setUserForm({ name: '', email: '', role: 'VENDEDOR', password: '' })
    setEditingUser(null)
    setCreatingUser(false)
    setShowPassword(false)
  }

  const startEdit = (user: User) => {
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    })
    setEditingUser(user)
    setCreatingUser(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red'
      case 'VENDEDOR': return 'blue'
      case 'ORCAMENTO': return 'green'
      case 'PRODUCAO': return 'yellow'
      default: return 'gray'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'VENDEDOR': return 'Vendedor'
      case 'ORCAMENTO': return 'Orçamento'
      case 'PRODUCAO': return 'Produção'
      default: return role
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <ResponsiveLayout title="Usuários" subtitle="Carregando...">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveLayout>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <ResponsiveLayout 
      title="Gerenciamento de Usuários"
      subtitle="Gerencie usuários do sistema"
      actions={
        <Button 
          icon={UserPlus} 
          onClick={() => {
            resetForm()
            setCreatingUser(true)
          }}
        >
          Novo Usuário
        </Button>
      }
    >
      {/* Mensagens */}
      {message && (
        <div className="mb-6">
          <Alert variant={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        </div>
      )}

      {/* Busca */}
      <div className="mb-6">
        <Input
          icon={Search}
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <div className="lg:col-span-2">
          <InfoCard title="Usuários do Sistema" icon={User}>
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {user.name}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`badge badge-${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <span className="text-xs text-gray-400">
                              • {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit}
                        onClick={() => startEdit(user)}
                      >
                        Editar
                      </Button>
                      {user.id !== parseInt(session.user.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              </div>
            )}
          </InfoCard>
        </div>

        {/* Formulário de Usuário */}
        <div>
          <InfoCard 
            title={editingUser ? 'Editar Usuário' : 'Novo Usuário'} 
            icon={editingUser ? Edit : UserPlus}
          >
            {creatingUser ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  required
                />
                
                <Select
                  label="Cargo"
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  required
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ORCAMENTO">Orçamento</option>
                  <option value="PRODUCAO">Produção</option>
                  <option value="ADMIN">Administrador</option>
                </Select>
                
                <div className="relative">
                  <Input
                    label={editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    required={!editingUser}
                    icon={showPassword ? EyeOff : Eye}
                    onIconClick={() => setShowPassword(!showPassword)}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button type="submit" loading={loading} className="flex-1">
                    {editingUser ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">
                  Clique em &ldquo;Novo Usuário&rdquo; para adicionar um usuário ao sistema
                </p>
              </div>
            )}
          </InfoCard>
        </div>
      </div>
    </ResponsiveLayout>
  )
}