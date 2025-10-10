import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Simula um upload aceito em ambiente de desenvolvimento
  return NextResponse.json({ ok: true })
}
