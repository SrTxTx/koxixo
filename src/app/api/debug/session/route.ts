import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return NextResponse.json({ error: 'Erro interno', hasSession: false }, { status: 500 })
  }
}