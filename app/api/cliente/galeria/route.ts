import { NextRequest, NextResponse } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
} from '@/lib/server/app-session'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

function cleanStorageKey(value: string) {
  return value.replace(/^\/+/, '')
}

export async function GET(request: NextRequest) {
  try {
    const session = readAppSessionToken(
      request.cookies.get(APP_SESSION_COOKIE)?.value,
    )

    if (!session) {
      return NextResponse.json(
        { ok: false, message: 'Tu sesión ha expirado.' },
        { status: 401 },
      )
    }

    if (session.userType !== 'ESTUDIANTE') {
      return NextResponse.json(
        { ok: false, message: 'Este acceso es exclusivo para estudiantes.' },
        { status: 403 },
      )
    }

    const admin = createSupabaseAdminClient()
    const bucket = process.env.SUPABASE_PHOTOS_BUCKET || 'photos'

    const { data: photoRows, error: photosError } = await admin
      .from('photos')
      .select(
        'id, storage_key, thumbnail_key, original_filename, created_at',
      )
      .eq('student_id', session.profileId)
      .order('created_at', { ascending: true })

    if (photosError) {
      console.error('Error obteniendo fotografías:', photosError)
      return NextResponse.json(
        { ok: false, message: 'No fue posible cargar tus fotografías.' },
        { status: 500 },
      )
    }

    const photos = await Promise.all(
      (photoRows || []).map(async (photo) => {
        const previewKey = cleanStorageKey(
          photo.thumbnail_key || photo.storage_key,
        )

        if (/^https?:\/\//i.test(previewKey)) {
          return {
            id: photo.id,
            fileName: photo.original_filename,
            url: previewKey,
          }
        }

        const { data: signedData, error: signedError } = await admin.storage
          .from(bucket)
          .createSignedUrl(previewKey, 60 * 60)

        if (signedError) {
          console.error(
            `No fue posible firmar ${previewKey} en el bucket ${bucket}:`,
            signedError,
          )
        }

        return {
          id: photo.id,
          fileName: photo.original_filename,
          url: signedData?.signedUrl || '/placeholder.jpg',
        }
      }),
    )

    const { data: latestSelection } = await admin
      .from('selections')
      .select('id, status')
      .eq('student_id', session.profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let selectedIds: string[] = []

    if (latestSelection?.id) {
      const { data: selectedRows } = await admin
        .from('selection_photos')
        .select('photo_id')
        .eq('selection_id', latestSelection.id)

      selectedIds = (selectedRows || []).map((row) => row.photo_id)
    }

    return NextResponse.json({
      ok: true,
      photos,
      selectedIds,
      selectionStatus: latestSelection?.status || null,
    })
  } catch (error) {
    console.error('Error cargando galería del estudiante:', error)
    return NextResponse.json(
      { ok: false, message: 'No fue posible cargar la galería.' },
      { status: 500 },
    )
  }
}
