import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

import { r2 } from '@/lib/r2'
import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { firstZodError, idSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }

  try {
    const parsedId = idSchema.safeParse((await params).id)
    if (!parsedId.success) {
      return NextResponse.json({ error: firstZodError(parsedId.error) }, { status: 400 })
    }
    const id = parsedId.data
    const admin = createSupabaseAdminClient()

    const { data: photo, error: fetchError } = await admin
      .from('photos')
      .select('storage_key, thumbnail_key')
      .eq('id', id)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada.' }, { status: 404 })
    }

    const bucket = process.env.R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'Falta configurar R2_BUCKET_NAME.' }, { status: 500 })
    }

    const keys = [photo.storage_key, photo.thumbnail_key].filter(
      (key): key is string => Boolean(key),
    )

    await r2.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )

    const { error: deleteError } = await admin
      .from('photos')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error eliminando fotografía:', error)
    return NextResponse.json({ error: 'No se pudo eliminar la foto.' }, { status: 500 })
  }
}
