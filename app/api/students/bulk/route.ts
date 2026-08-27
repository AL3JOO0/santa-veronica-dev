import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import {
  hashStudentPassword,
  normalizeDocumentNumber,
} from '@/lib/server/student-password'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { bulkStudentsSchema, firstZodError } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json(
      { ok: false, message: 'No tienes permisos para importar estudiantes.' },
      { status: 401 },
    )
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
  }

  try {
    const parsed = bulkStudentsSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(parsed.error) },
        { status: 400 },
      )
    }

    const { eventId, students: rows } = parsed.data

    const normalized = rows.map((row, index) => {
      const documentNumber = normalizeDocumentNumber(row.documentNumber || '')
      const firstName = row.firstName
      const lastName = row.lastName
      const email = row.email
      const password = row.password
      const status = row.status

      if (!documentNumber || !firstName || !lastName || !password) {
        throw new Error(`Fila del lote ${index + 1}: documento, nombre, apellido y contraseña son obligatorios.`)
      }
      return { documentNumber, firstName, lastName, email, password, status }
    })

    const seen = new Set<string>()
    for (const row of normalized) {
      if (seen.has(row.documentNumber)) {
        return NextResponse.json(
          { ok: false, message: `El documento ${row.documentNumber} está repetido en el archivo.` },
          { status: 400 },
        )
      }
      seen.add(row.documentNumber)
    }

    const admin = createSupabaseAdminClient()
    const documents = normalized.map((row) => row.documentNumber)
    const { data: existingRows, error: existingError } = await admin
      .from('students')
      .select('id, event_id, document_number')
      .in('document_number', documents)

    if (existingError) throw existingError

    const existingMap = new Map((existingRows || []).map((row) => [row.document_number, row]))
    const crossEvent = normalized.find((row) => {
      const existing = existingMap.get(row.documentNumber)
      return existing && existing.event_id !== eventId
    })

    if (crossEvent) {
      return NextResponse.json(
        { ok: false, message: `El documento ${crossEvent.documentNumber} ya pertenece a otro evento.` },
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    const payload = await Promise.all(
      normalized.map(async (row) => ({
        event_id: eventId,
        document_number: row.documentNumber,
        first_name: row.firstName,
        last_name: row.lastName,
        email: row.email,
        password_hash: await hashStudentPassword(row.password),
        status: row.status,
        updated_at: now,
      })),
    )

    const { error: upsertError } = await admin
      .from('students')
      .upsert(payload, { onConflict: 'document_number' })

    if (upsertError) {
      if (upsertError.code === '42P10') {
        return NextResponse.json(
          {
            ok: false,
            message:
              'Falta crear el índice único de document_number. Ejecuta supabase/student_password_login.sql después de limpiar los documentos duplicados.',
          },
          { status: 409 },
        )
      }
      throw upsertError
    }

    const updated = normalized.filter((row) => existingMap.has(row.documentNumber)).length
    const created = normalized.length - updated
    return NextResponse.json({ ok: true, created, updated })
  } catch (error) {
    console.error('Error importando estudiantes:', error)
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'No se pudo importar el archivo.',
      },
      { status: 500 },
    )
  }
}
