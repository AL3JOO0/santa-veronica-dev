import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 10

const UNIVERSITY_COLUMNS =
  'id, name, short_name, description, location, active, notification_email, created_at, updated_at'

export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('institutions')
      .select(UNIVERSITY_COLUMNS)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(
      { ok: true, data: data || [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Error obteniendo instituciones:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudieron obtener las universidades.' },
      { status: 500 },
    )
  }
}
