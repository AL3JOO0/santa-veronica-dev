import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { studentId, key, filename, mimeType, fileSize } = body ?? {}

    if (!studentId || !key || !filename || !mimeType || !Number.isFinite(Number(fileSize))) {
      return NextResponse.json(
        { ok: false, message: 'Faltan datos de la fotografía.' },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('photos')
      .insert({
        student_id: studentId,
        storage_key: key,
        original_filename: filename,
        mime_type: mimeType,
        file_size: Number(fileSize),
      })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('Error registrando fotografía:', error)
    return NextResponse.json(
      { ok: false, message: 'La fotografía se subió, pero no pudo registrarse.' },
      { status: 500 },
    )
  }
}
