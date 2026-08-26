import { NextRequest, NextResponse } from 'next/server'

import { getPhotoReadUrl } from '@/lib/r2'
import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { firstZodError, idSchema, paginationSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

interface PhotoRow {
  id: string
  student_id: string
  storage_key: string
  thumbnail_key: string | null
  original_filename: string
  mime_type: string
  file_size: number
  created_at: string
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const studentId = idSchema.safeParse(request.nextUrl.searchParams.get('studentId'))
    const pagination = paginationSchema.safeParse({
      page: request.nextUrl.searchParams.get('page') || undefined,
      pageSize: request.nextUrl.searchParams.get('pageSize') || undefined,
    })
    if (!studentId.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(studentId.error) },
        { status: 400 },
      )
    }
    if (!pagination.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(pagination.error) },
        { status: 400 },
      )
    }
    const { page, pageSize } = pagination.data
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const admin = createSupabaseAdminClient()
    const { data, error, count } = await admin
      .from('photos')
      .select(
        'id, student_id, storage_key, thumbnail_key, original_filename, mime_type, file_size, created_at',
        { count: 'exact' },
      )
      .eq('student_id', studentId.data)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    const photos = await Promise.all(
      (data || []).map(async (photo: PhotoRow) => ({
        ...photo,
        display_url: /^https?:\/\//i.test(photo.thumbnail_key || photo.storage_key)
          ? photo.thumbnail_key || photo.storage_key
          : await getPhotoReadUrl(photo.thumbnail_key || photo.storage_key),
      })),
    )

    const total = count || 0
    return NextResponse.json({
      ok: true,
      data: photos,
      pagination: { page, pageSize, total, hasMore: to + 1 < total },
    })
  } catch (error) {
    console.error('Error listando fotografías:', error)
    return NextResponse.json(
      { ok: false, message: 'No fue posible cargar las fotografías.' },
      { status: 500 },
    )
  }
}
