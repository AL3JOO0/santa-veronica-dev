import type { NextRequest } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
  type AppSession,
} from '@/lib/server/app-session'

export function getRequestSession(request: NextRequest): AppSession | null {
  return readAppSessionToken(request.cookies.get(APP_SESSION_COOKIE)?.value)
}

export function getAdminSession(request: NextRequest): AppSession | null {
  const session = getRequestSession(request)
  return session?.userType === 'ADMINISTRADOR' ? session : null
}
