import { NextRequest, NextResponse } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
} from '@/lib/server/app-session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = readAppSessionToken(request.cookies.get(APP_SESSION_COOKIE)?.value)

  if (pathname === '/login' || pathname === '/admin/login' || pathname === '/cliente/login') {
    if (!session) return NextResponse.next()
    const destination = session.userType === 'ADMINISTRADOR' ? '/' : '/cliente/galeria'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (pathname.startsWith('/cliente')) {
    if (session?.userType === 'ESTUDIANTE') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session?.userType === 'ADMINISTRADOR') return NextResponse.next()
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/', '/eventos/:path*', '/universidades/:path*', '/cliente/:path*', '/login', '/admin/login', '/cliente/login'],
}
