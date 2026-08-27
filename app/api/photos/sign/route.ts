import { randomUUID } from 'node:crypto'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { r2 } from '@/lib/r2'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { firstZodError, photoSignSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export async function POST(req: NextRequest) {
  if (!(await getAdminSession(req))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  try {
    const parsed = photoSignSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 })
    }
    const { studentId, mimeType, fileSize, preview } = parsed.data

    const admin = createSupabaseAdminClient()
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id')
      .eq('id', studentId)
      .maybeSingle()
    if (studentError) throw studentError
    if (!student) return NextResponse.json({ error: 'El estudiante no existe.' }, { status: 404 })

    const bucket = process.env.R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'Falta configurar R2_BUCKET_NAME.' }, { status: 500 })
    }

    const objectId = randomUUID()
    const extension = EXTENSION_BY_TYPE[mimeType]
    const previewExtension = EXTENSION_BY_TYPE[preview.mimeType]
    const key = `students/${studentId}/originals/${objectId}.${extension}`
    const thumbnailKey = `students/${studentId}/previews/${objectId}.${previewExtension}`

    const originalCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
      ContentLength: fileSize,
    })
    const previewCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: thumbnailKey,
      ContentType: preview.mimeType,
      ContentLength: preview.fileSize,
    })

    const [uploadUrl, previewUploadUrl] = await Promise.all([
      getSignedUrl(r2, originalCommand, { expiresIn: 300 }),
      getSignedUrl(r2, previewCommand, { expiresIn: 300 }),
    ])

    return NextResponse.json({ uploadUrl, key, previewUploadUrl, thumbnailKey })
  } catch (error) {
    console.error('Error generando URL de carga:', error)
    return NextResponse.json({ error: 'No se pudo iniciar la carga.' }, { status: 500 })
  }
}
