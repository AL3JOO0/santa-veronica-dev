import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import {
  hashStudentPassword,
  normalizeDocumentNumber,
} from '@/lib/server/student-password'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { firstZodError, idSchema, updateStudentSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

const STUDENT_COLUMNS =
  'id, event_id, document_number, first_name, last_name, email, status, created_at, updated_at'

function unauthorized() {
  return NextResponse.json(
    { ok: false, message: 'No tienes permisos para realizar esta acción.' },
    { status: 401 },
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession(request))) return unauthorized()
  const params = idSchema.safeParse((await context.params).id)
  if (!params.success) {
    return NextResponse.json({ ok: false, message: firstZodError(params.error) }, { status: 400 })
  }
  const id = params.data

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('students')
      .select(STUDENT_COLUMNS)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { ok: false, message: 'El estudiante no existe.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error obteniendo estudiante:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudo obtener el estudiante.' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession(request))) return unauthorized()
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
  }
  const params = idSchema.safeParse((await context.params).id)
  if (!params.success) {
    return NextResponse.json({ ok: false, message: firstZodError(params.error) }, { status: 400 })
  }
  const id = params.data

  try {
    const parsed = updateStudentSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(parsed.error) },
        { status: 400 },
      )
    }
    const body = parsed.data

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.eventId !== undefined) payload.event_id = body.eventId

    if (body.documentNumber !== undefined) {
      const documentNumber = normalizeDocumentNumber(body.documentNumber)
      if (!documentNumber) {
        return NextResponse.json(
          { ok: false, message: 'El documento es obligatorio.' },
          { status: 400 },
        )
      }
      payload.document_number = documentNumber
    }

    if (body.firstName !== undefined) {
      payload.first_name = body.firstName
    }

    if (body.lastName !== undefined) {
      payload.last_name = body.lastName
    }

    if (body.email !== undefined) payload.email = body.email
    if (body.status !== undefined) payload.status = body.status
    if (body.password) {
      payload.password_hash = await hashStudentPassword(body.password)
    }

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('students')
      .update(payload)
      .eq('id', id)
      .select(STUDENT_COLUMNS)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: false, message: 'Ese número de documento ya está registrado.' },
          { status: 409 },
        )
      }
      throw error
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error actualizando estudiante:', error)
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : 'No se pudo actualizar el estudiante.',
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession(request))) return unauthorized()
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
  }
  const params = idSchema.safeParse((await context.params).id)
  if (!params.success) {
    return NextResponse.json({ ok: false, message: firstZodError(params.error) }, { status: 400 })
  }
  const id = params.data

  try {
    const admin = createSupabaseAdminClient()
    const { error } = await admin.from('students').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando estudiante:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudo eliminar el estudiante.' },
      { status: 500 },
    )
  }
}
