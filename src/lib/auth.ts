import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createAuthPrismaClient } from './prisma'
import { executeWithRetry } from './db-config'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log('🔍 Tentativa de login para:', credentials.email)
          
          let authPrisma = createAuthPrismaClient()
          let user = null
          
          try {
            // Executar consulta com retry automático para problemas de prepared statements
            user = await executeWithRetry(async () => {
              return await authPrisma.user.findUnique({
                where: {
                  email: credentials.email
                }
              })
            }, 5, 150, () => {
              // Criar novo cliente se ocorrer erro de prepared statement
              try {
                authPrisma.$disconnect()
              } catch (e) {
                console.log('⚠️ Error disconnecting old client:', e)
              }
              authPrisma = createAuthPrismaClient()
              return authPrisma
            })

          console.log('👤 User found:', user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hasPassword: !!user.password,
            passwordLength: user.password?.length
          } : 'User not found')

          if (!user) {
            console.log('❌ User not found for email:', credentials.email)
            return null
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Validando credenciais (detalhes sensíveis ocultos em produção)')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Senha válida?', isPasswordValid)
          }

          if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', credentials.email)
            return null
          }

          console.log('🎉 Login successful for:', credentials.email)
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          }
          
          } catch (error) {
            console.error('💥 Erro durante autenticação:', error)
            return null
          } finally {
            // Garantir desconexão do cliente específico de autenticação
            try {
              await authPrisma.$disconnect()
              console.log('🔌 Cliente auth desconectado com sucesso')
            } catch (disconnectError) {
              console.log('⚠️ Erro ao desconectar cliente auth:', disconnectError)
            }
          }
        } catch (error) {
          console.error('💥 Erro geral durante autenticação:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  }
}