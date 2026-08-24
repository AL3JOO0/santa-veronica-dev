import { NextRequest, NextResponse } from 'next/server'

import { getPhotoReadUrl } from '@/lib/r2'
import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!getAdminSession(request)) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const studentId = request.nextUrl.searchParams.get('studentId')?.trim()
    if (!studentId) {
      return NextResponse.json(
        { ok: false, message: 'Falta el estudiante.' },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('photos')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const photos = await Promise.all(
      (data || []).map(async (photo: any) => ({
        ...photo,
        display_url: /^https?:\/\//i.test(photo.thumbnail_key || photo.storage_key)
          ? photo.thumbnail_key || photo.storage_key
          : await getPhotoReadUrl(photo.thumbnail_key || photo.storage_key),
      })),
    )

    return NextResponse.json({ ok: true, data: photos })
  } catch (error) {
    console.error('Error listando fotografías:', error)
    return NextResponse.json(
      { ok: false, message: 'No fue posible cargar las fotografías.' },
      { status: 500 },
    )
  }
}
