import { randomUUID } from 'node:crypto'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { r2 } from '@/lib/r2'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!getAdminSession(req)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const { studentId, filename, mimeType } = await req.json()

    if (!studentId || !filename || !mimeType) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    if (!String(mimeType).startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen.' }, { status: 400 })
    }

    const bucket = process.env.R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'Falta configurar R2_BUCKET_NAME.' }, { status: 500 })
    }

    const extension = String(filename).split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
    const key = `students/${studentId}/${randomUUID()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 })

    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error('Error generando URL de carga:', error)
    return NextResponse.json({ error: 'No se pudo iniciar la carga.' }, { status: 500 })
  }
}
