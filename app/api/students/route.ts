import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import {
  hashStudentPassword,
  normalizeDocumentNumber,
} from '@/lib/server/student-password'

export const runtime = 'nodejs'

const STUDENT_COLUMNS =
  'id, event_id, document_number, first_name, last_name, email, status, created_at, updated_at'

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: 'No tienes permisos para realizar esta acción.' },
    { status: 401 },
  )
}

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) return unauthorized()

  try {
    const admin = createSupabaseAdminClient()
    const eventId = request.nextUrl.searchParams.get('eventId')

    let query = admin
      .from('students')
      .select(STUDENT_COLUMNS)
      .order('created_at', { ascending: false })

    if (eventId) query = query.eq('event_id', eventId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudieron obtener los estudiantes.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  if (!getAdminSession(request)) return unauthorized()

  try {
    const body = (await request.json().catch(() => null)) as
      | {
          eventId?: string
          documentNumber?: string
          firstName?: string
          lastName?: string
          email?: string | null
          password?: string
          status?: string
        }
      | null

    const eventId = body?.eventId?.trim() || ''
    const documentNumber = normalizeDocumentNumber(body?.documentNumber || '')
    const firstName = body?.firstName?.trim() || ''
    const lastName = body?.lastName?.trim() || ''
    const email = body?.email?.trim() || null
    const password = body?.password || ''
    const status = body?.status || 'PENDING'

    if (!eventId || !documentNumber || !firstName || !lastName || !password) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Documento, nombre, apellido, contraseña y evento son obligatorios.',
        },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()

    const { data: existing } = await admin
      .from('students')
      .select('id')
      .eq('document_number', documentNumber)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Ya existe un estudiante con el documento ${documentNumber}.`,
        },
        { status: 409 },
      )
    }

    const passwordHash = await hashStudentPassword(password)

    const { data, error } = await admin
      .from('students')
      .insert({
        event_id: eventId,
        document_number: documentNumber,
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: passwordHash,
        status,
      })
      .select(STUDENT_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            ok: false,
            message: `Ya existe un estudiante con el documento ${documentNumber}.`,
          },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json({ ok: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creando estudiante:', error)
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : 'No se pudo crear el estudiante.',
      },
      { status: 500 },
    )
  }
}
