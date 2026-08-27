import { NextRequest, NextResponse } from 'next/server'

import { APP_SESSION_COOKIE } from '@/lib/server/app-session'
import { isSameOriginRequest } from '@/lib/server/request-security'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
  }
  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: APP_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
