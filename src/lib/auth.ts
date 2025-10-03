import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
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
          
          // Usar retry helper para problemas de prepared statements
          const user = await executeWithRetry(async () => {
            return await prisma.user.findUnique({
              where: {
                email: credentials.email
              }
            })
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

          console.log('🔐 Comparing passwords...')
          console.log('Input password:', credentials.password)
          console.log('Stored hash length:', user.password.length)
          console.log('Hash starts with:', user.password.substring(0, 20) + '...')

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('✅ Password valid?', isPasswordValid)

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