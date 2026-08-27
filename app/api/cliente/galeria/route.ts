import { NextRequest, NextResponse } from 'next/server'

import { getStudentSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { getPhotoReadUrl } from '@/lib/r2'
import { firstZodError, paginationSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

interface GalleryPhotoRow {
  id: string
  storage_key: string
  thumbnail_key: string | null
  original_filename: string
}

interface SelectionPhotoRow {
  photo_id: string
}

function cleanStorageKey(value: string) {
  return value.replace(/^\/+/, '')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getStudentSession(request)

    if (!session) {
      return NextResponse.json(
        { ok: false, message: 'Tu sesión ha expirado.' },
        { status: 401 },
      )
    }

    const admin = createSupabaseAdminClient()
    const pagination = paginationSchema.safeParse({
      page: request.nextUrl.searchParams.get('page') || undefined,
      pageSize: request.nextUrl.searchParams.get('pageSize') || undefined,
    })
    if (!pagination.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(pagination.error) },
        { status: 400 },
      )
    }
    const { page, pageSize } = pagination.data
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: photoRows, error: photosError, count } = await admin
      .from('photos')
      .select(
        'id, storage_key, thumbnail_key, original_filename, created_at',
        { count: 'exact' },
      )
      .eq('student_id', session.profileId)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (photosError) {
      console.error('Error obteniendo fotografías:', photosError)
      return NextResponse.json(
        { ok: false, message: 'No fue posible cargar tus fotografías.' },
        { status: 500 },
      )
    }

    const photos = await Promise.all(
      (photoRows || []).map(async (photo: GalleryPhotoRow) => {
        const previewKey = cleanStorageKey(
          photo.thumbnail_key || photo.storage_key,
        )

        const url = /^https?:\/\//i.test(previewKey)
          ? previewKey
          : await getPhotoReadUrl(previewKey)

        return {
          id: photo.id,
          fileName: photo.original_filename,
          url,
          hasEmbeddedWatermark: Boolean(photo.thumbnail_key),
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

      selectedIds = (selectedRows || []).map((row: SelectionPhotoRow) => row.photo_id)
    }

    return NextResponse.json({
      ok: true,
      photos,
      selectedIds,
      selectionStatus: latestSelection?.status || null,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
      },
    })
  } catch (error) {
    console.error('Error cargando galería del estudiante:', error)
    return NextResponse.json(
      { ok: false, message: 'No fue posible cargar la galería.' },
      { status: 500 },
    )
  }
}
