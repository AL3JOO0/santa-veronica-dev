import { createHmac, timingSafeEqual } from 'node:crypto'

export type AppUserType = 'ADMINISTRADOR' | 'ESTUDIANTE'

export interface AppSession {
  authUserId: string
  profileId: string
  identifier: string
  userType: AppUserType
  displayName: string
  role?: string
  documentNumber?: string
  eventName?: string
  studentStatus?: string
  expiresAt: number
}

const DEFAULT_SESSION_SECONDS = 60 * 60 * 8
const REMEMBER_SESSION_SECONDS = 60 * 60 * 24 * 30

export const APP_SESSION_COOKIE = 'sv_session'

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)

  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar APP_SESSION_SECRET.')
  }

  return 'santa-veronica-login-unificado-dev-secret'
}

function sign(payload: string) {
  return createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url')
}

export function getSessionDuration(remember: boolean) {
  return remember ? REMEMBER_SESSION_SECONDS : DEFAULT_SESSION_SECONDS
}

export function createAppSessionToken(
  session: Omit<AppSession, 'expiresAt'>,
  remember: boolean,
) {
  const maxAge = getSessionDuration(remember)
  const payloadValue: AppSession = {
    ...session,
    expiresAt: Math.floor(Date.now() / 1000) + maxAge,
  }

  const payload = Buffer.from(JSON.stringify(payloadValue), 'utf8').toString(
    'base64url',
  )

  return {
    token: `${payload}.${sign(payload)}`,
    maxAge,
  }
}

export function readAppSessionToken(token?: string | null): AppSession | null {
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  if (!safeEqual(signature, expected)) return null

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as AppSession

    if (
      !session.authUserId ||
      !session.profileId ||
      !session.identifier ||
      !session.userType ||
      !session.displayName ||
      !session.expiresAt ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null
    }

    if (
      session.userType !== 'ADMINISTRADOR' &&
      session.userType !== 'ESTUDIANTE'
    ) {
      return null
    }

    return session
  } catch {
    return null
  }
}
