import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

import { r2 } from '@/lib/r2'
import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const admin = createSupabaseAdminClient()

    const { data: photo, error: fetchError } = await admin
      .from('photos')
      .select('storage_key')
      .eq('id', id)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto no encontrada.' }, { status: 404 })
    }

    const bucket = process.env.R2_BUCKET_NAME
    if (!bucket) {
      return NextResponse.json({ error: 'Falta configurar R2_BUCKET_NAME.' }, { status: 500 })
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: photo.storage_key,
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
