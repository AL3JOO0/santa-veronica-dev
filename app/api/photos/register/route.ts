import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

import { r2 } from '@/lib/r2'
import { getAdminSession } from '@/lib/server/auth-guards'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from '@/lib/upload-constraints'
import { firstZodError, photoRegisterSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
  }

  try {
    const parsed = photoRegisterSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(parsed.error) },
        { status: 400 },
      )
    }
    const { studentId, key, filename, mimeType } = parsed.data
    if (!key.startsWith(`students/${studentId}/`)) {
      return NextResponse.json(
        { ok: false, message: 'La ruta de la fotografía no es válida.' },
        { status: 400 },
      )
    }

    const bucket = process.env.R2_BUCKET_NAME
    if (!bucket) throw new Error('Falta configurar R2_BUCKET_NAME.')
    const object = await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    const actualSize = object.ContentLength || 0
    const actualType = object.ContentType || ''
    if (
      actualSize <= 0 ||
      actualSize > MAX_IMAGE_BYTES ||
      !ALLOWED_IMAGE_TYPES.includes(actualType as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
      actualType !== mimeType
    ) {
      return NextResponse.json(
        { ok: false, message: 'El objeto subido no coincide con una imagen permitida.' },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id')
      .eq('id', studentId)
      .maybeSingle()
    if (studentError) throw studentError
    if (!student) {
      return NextResponse.json({ ok: false, message: 'El estudiante no existe.' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('photos')
      .insert({
        student_id: studentId,
        storage_key: key,
        original_filename: filename,
        mime_type: mimeType,
        file_size: actualSize,
      })
      .select('id, student_id, storage_key, thumbnail_key, original_filename, mime_type, file_size, created_at')
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
