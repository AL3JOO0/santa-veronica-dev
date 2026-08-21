export type AppUserType = 'ADMINISTRADOR' | 'ESTUDIANTE'

export interface AppSession {
  profileId: string
  identifier: string
  userType: AppUserType
  displayName: string
  role?: string
  documentNumber?: string
  eventName?: string
  studentStatus?: string
}

interface AuthResponse {
  ok: boolean
  session?: AppSession
  redirectTo?: string
  message?: string
}

async function parseResponse(response: Response): Promise<AuthResponse> {
  const data = (await response.json().catch(() => null)) as AuthResponse | null

  if (!data) {
    return {
      ok: false,
      message: 'No fue posible procesar la respuesta del servicio de autenticación.',
    }
  }

  return data
}

export async function login(
  identifier: string,
  password: string,
  remember = false,
): Promise<{ session: AppSession; redirectTo: string }> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password, remember }),
  })

  const data = await parseResponse(response)

  if (!response.ok || !data.ok || !data.session) {
    throw new Error(data.message || 'Usuario o contraseña incorrectos.')
  }

  return {
    session: data.session,
    redirectTo:
      data.redirectTo ||
      (data.session.userType === 'ESTUDIANTE' ? '/cliente/galeria' : '/'),
  }
}

export async function getSession(): Promise<AppSession | null> {
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) return null

  const data = await parseResponse(response)
  return data.ok && data.session ? data.session : null
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
  })
}
