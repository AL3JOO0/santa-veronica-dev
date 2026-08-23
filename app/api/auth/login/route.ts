import { NextRequest, NextResponse } from 'next/server'
import {
  APP_SESSION_COOKIE,
  createAppSessionToken,
  type AppSession,
} from '@/lib/server/app-session'
import {
  createSupabaseAdminClient,
  createSupabasePasswordClient,
} from '@/lib/server/supabase-admin'
import {
  normalizeDocumentNumber,
  verifyStudentPassword,
} from '@/lib/server/student-password'

export const runtime = 'nodejs'

function normalizeIdentifier(value: string) {
  const trimmed = value.trim()
  if (/^[\d.\-\s]+$/.test(trimmed)) return normalizeDocumentNumber(trimmed)
  return trimmed.toLowerCase()
}

function isValidIdentifier(value: string) {
  return /^[a-z0-9._-]{3,100}$/.test(value)
}

async function loginAdministrator(
  identifier: string,
  password: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data: access, error: accessError } = await admin
    .from('usuarios_acceso')
    .select('auth_user_id, identificador, tipo_usuario, id_usuario, activo')
    .eq('identificador', identifier)
    .eq('activo', true)
    .maybeSingle()

  if (accessError) {
    console.error('Error consultando usuarios_acceso:', accessError)
    throw new Error('No fue posible validar el acceso administrativo.')
  }

  if (!access || access.tipo_usuario !== 'ADMINISTRADOR' || !access.auth_user_id || !access.id_usuario) return null

  const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(access.auth_user_id)
  const email = authUserData?.user?.email
  if (authUserError || !email) return null

  const passwordClient = createSupabasePasswordClient()
  const { data: signInData, error: signInError } = await passwordClient.auth.signInWithPassword({ email, password })
  if (signInError || !signInData.user || signInData.user.id !== access.auth_user_id) return null

  const { data: userProfile, error: userError } = await admin
    .from('users')
    .select('id, name, email, role, active')
    .eq('id', access.id_usuario)
    .maybeSingle()

  if (userError || !userProfile?.active) return null

  const sessionData: Omit<AppSession, 'expiresAt'> = {
    authUserId: access.auth_user_id,
    profileId: userProfile.id,
    identifier,
    userType: 'ADMINISTRADOR',
    displayName: userProfile.name,
    role: userProfile.role,
  }

  return { sessionData, redirectTo: '/' }
}

async function loginStudent(
  identifier: string,
  password: string,
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const documentNumber = normalizeDocumentNumber(identifier)
  if (!documentNumber) return null

  const { data: studentRows, error: studentError } = await admin
    .from('students')
    .select('id, event_id, document_number, first_name, last_name, status, password_hash')
    .eq('document_number', documentNumber)
    .limit(2)

  if (studentError) {
    console.error('Error consultando estudiante:', studentError)
    throw new Error('No fue posible validar el acceso del estudiante.')
  }

  if (!studentRows || studentRows.length === 0) return null
  if (studentRows.length > 1) {
    console.error(`Documento duplicado en students: ${documentNumber}`)
    throw new Error('El documento está duplicado en la base de datos. Contacta al administrador.')
  }

  const student = studentRows[0]
  if (!student.password_hash) return null
  if (!(await verifyStudentPassword(password, student.password_hash))) return null

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('name')
    .eq('id', student.event_id)
    .maybeSingle()

  if (eventError) console.error('Error obteniendo evento del estudiante:', eventError)

  const sessionData: Omit<AppSession, 'expiresAt'> = {
    profileId: student.id,
    identifier: documentNumber,
    userType: 'ESTUDIANTE',
    displayName: `${student.first_name} ${student.last_name}`.trim(),
    documentNumber: student.document_number,
    eventName: event?.name || 'Galería personal',
    studentStatus: student.status,
  }

  return { sessionData, redirectTo: '/cliente/galeria' }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { identifier?: string; password?: string; remember?: boolean }
      | null

    const identifier = normalizeIdentifier(body?.identifier || '')
    const password = body?.password || ''
    const remember = Boolean(body?.remember)

    if (!identifier || !password) {
      return NextResponse.json({ ok: false, message: 'Ingresa el usuario o cédula y la contraseña.' }, { status: 400 })
    }

    if (!isValidIdentifier(identifier)) {
      return NextResponse.json({ ok: false, message: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()
    const adminResult = await loginAdministrator(identifier, password, admin)
    const result = adminResult || (await loginStudent(identifier, password, admin))

    if (!result) {
      return NextResponse.json({ ok: false, message: 'Usuario o contraseña incorrectos.' }, { status: 401 })
    }

    const { token, maxAge } = createAppSessionToken(result.sessionData, remember)
    const response = NextResponse.json({
      ok: true,
      session: {
        profileId: result.sessionData.profileId,
        identifier: result.sessionData.identifier,
        userType: result.sessionData.userType,
        displayName: result.sessionData.displayName,
        role: result.sessionData.role,
        documentNumber: result.sessionData.documentNumber,
        eventName: result.sessionData.eventName,
        studentStatus: result.sessionData.studentStatus,
      },
      redirectTo: result.redirectTo,
    })

    response.cookies.set({
      name: APP_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge,
    })
    return response
  } catch (error) {
    console.error('Error en login unificado:', error)
    const message =
      error instanceof Error &&
      (error.message.includes('variable de entorno') || error.message.includes('duplicado'))
        ? error.message
        : 'No fue posible iniciar sesión en este momento.'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
