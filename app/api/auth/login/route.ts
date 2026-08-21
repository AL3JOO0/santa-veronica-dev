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

export const runtime = 'nodejs'

function normalizeIdentifier(value: string) {
  const trimmed = value.trim()

  if (/^[\d.\-\s]+$/.test(trimmed)) {
    return trimmed.replace(/\D/g, '')
  }

  return trimmed.toLowerCase()
}

function isValidIdentifier(value: string) {
  return /^[a-z0-9._-]{3,100}$/.test(value)
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
      return NextResponse.json(
        { ok: false, message: 'Ingresa el usuario o cédula y la contraseña.' },
        { status: 400 },
      )
    }

    if (!isValidIdentifier(identifier)) {
      return NextResponse.json(
        { ok: false, message: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      )
    }

    const admin = createSupabaseAdminClient()

    const { data: access, error: accessError } = await admin
      .from('usuarios_acceso')
      .select(
        'auth_user_id, identificador, tipo_usuario, id_usuario, id_estudiante, activo',
      )
      .eq('identificador', identifier)
      .eq('activo', true)
      .maybeSingle()

    if (accessError) {
      console.error('Error consultando usuarios_acceso:', accessError)
      return NextResponse.json(
        { ok: false, message: 'No fue posible validar el acceso.' },
        { status: 500 },
      )
    }

    if (!access?.auth_user_id) {
      return NextResponse.json(
        { ok: false, message: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      )
    }

    const { data: authUserData, error: authUserError } =
      await admin.auth.admin.getUserById(access.auth_user_id)

    const email = authUserData?.user?.email

    if (authUserError || !email) {
      console.error('Error obteniendo usuario de Supabase Auth:', authUserError)
      return NextResponse.json(
        { ok: false, message: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      )
    }

    const passwordClient = createSupabasePasswordClient()
    const { data: signInData, error: signInError } =
      await passwordClient.auth.signInWithPassword({
        email,
        password,
      })

    if (
      signInError ||
      !signInData.user ||
      signInData.user.id !== access.auth_user_id
    ) {
      return NextResponse.json(
        { ok: false, message: 'Usuario o contraseña incorrectos.' },
        { status: 401 },
      )
    }

    let sessionData: Omit<AppSession, 'expiresAt'>
    let redirectTo = '/'

    if (access.tipo_usuario === 'ADMINISTRADOR') {
      if (!access.id_usuario) {
        return NextResponse.json(
          { ok: false, message: 'El usuario no tiene un perfil administrativo asociado.' },
          { status: 403 },
        )
      }

      const { data: userProfile, error: userError } = await admin
        .from('users')
        .select('id, name, email, role, active')
        .eq('id', access.id_usuario)
        .maybeSingle()

      if (userError || !userProfile?.active) {
        return NextResponse.json(
          { ok: false, message: 'El usuario administrativo está inactivo o no existe.' },
          { status: 403 },
        )
      }

      sessionData = {
        authUserId: access.auth_user_id,
        profileId: userProfile.id,
        identifier,
        userType: 'ADMINISTRADOR',
        displayName: userProfile.name,
        role: userProfile.role,
      }
    } else if (access.tipo_usuario === 'ESTUDIANTE') {
      if (!access.id_estudiante) {
        return NextResponse.json(
          { ok: false, message: 'El usuario no tiene un estudiante asociado.' },
          { status: 403 },
        )
      }

      const { data: student, error: studentError } = await admin
        .from('students')
        .select(
          'id, event_id, document_number, first_name, last_name, status',
        )
        .eq('id', access.id_estudiante)
        .maybeSingle()

      if (studentError || !student) {
        return NextResponse.json(
          { ok: false, message: 'El estudiante asociado no existe.' },
          { status: 403 },
        )
      }

      const { data: event } = await admin
        .from('events')
        .select('name')
        .eq('id', student.event_id)
        .maybeSingle()

      sessionData = {
        authUserId: access.auth_user_id,
        profileId: student.id,
        identifier,
        userType: 'ESTUDIANTE',
        displayName: `${student.first_name} ${student.last_name}`.trim(),
        documentNumber: student.document_number,
        eventName: event?.name || 'Galería personal',
        studentStatus: student.status,
      }
      redirectTo = '/cliente/galeria'
    } else {
      return NextResponse.json(
        { ok: false, message: 'Tipo de usuario no reconocido.' },
        { status: 403 },
      )
    }

    const { token, maxAge } = createAppSessionToken(sessionData, remember)

    const response = NextResponse.json({
      ok: true,
      session: {
        profileId: sessionData.profileId,
        identifier: sessionData.identifier,
        userType: sessionData.userType,
        displayName: sessionData.displayName,
        role: sessionData.role,
        documentNumber: sessionData.documentNumber,
        eventName: sessionData.eventName,
        studentStatus: sessionData.studentStatus,
      },
      redirectTo,
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
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error && error.message.includes('variable de entorno')
            ? error.message
            : 'No fue posible iniciar sesión en este momento.',
      },
      { status: 500 },
    )
  }
}
