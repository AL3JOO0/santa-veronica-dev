import 'server-only'

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
  type AppSession,
} from '@/lib/server/app-session'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export function getRequestSession(request: NextRequest): AppSession | null {
  return readAppSessionToken(request.cookies.get(APP_SESSION_COOKIE)?.value)
}

async function isSessionProfileActive(session: AppSession) {
  const admin = createSupabaseAdminClient()

  if (session.userType === 'ADMINISTRADOR') {
    const { data, error } = await admin
      .from('users')
      .select('id')
      .eq('id', session.profileId)
      .eq('active', true)
      .maybeSingle()
    return !error && Boolean(data)
  }

  const { data, error } = await admin
    .from('students')
    .select('id')
    .eq('id', session.profileId)
    .eq('document_number', session.documentNumber || '')
    .maybeSingle()
  return !error && Boolean(data)
}

export async function getAdminSession(request: NextRequest): Promise<AppSession | null> {
  const session = getRequestSession(request)
  if (session?.userType !== 'ADMINISTRADOR') return null
  return (await isSessionProfileActive(session)) ? session : null
}

export async function getStudentSession(request: NextRequest): Promise<AppSession | null> {
  const session = getRequestSession(request)
  if (session?.userType !== 'ESTUDIANTE') return null
  return (await isSessionProfileActive(session)) ? session : null
}

async function getServerSession(): Promise<AppSession | null> {
  const cookieStore = await cookies()
  return readAppSessionToken(cookieStore.get(APP_SESSION_COOKIE)?.value)
}

export async function requireAdminSession(): Promise<AppSession> {
  const session = await getServerSession()
  if (session?.userType !== 'ADMINISTRADOR') {
    throw new Error('No tienes permisos para realizar esta acción.')
  }
  if (!(await isSessionProfileActive(session))) {
    throw new Error('Tu sesión ya no es válida.')
  }
  return session
}
