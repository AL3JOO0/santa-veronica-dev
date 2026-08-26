import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import type { EventItem, Status } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 10

const EVENT_COLUMNS =
  'id, institution_id, name, description, event_date, status, created_at, updated_at'

function mapStatus(status: string): Status {
  return ({
    ACTIVE: 'activo',
    DRAFT: 'borrador',
    CLOSED: 'cerrado',
    ARCHIVED: 'archivado',
  } as const)[status.toUpperCase()] || 'borrador'
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('events')
      .select(EVENT_COLUMNS)
      .order('created_at', { ascending: false })

    if (error) throw error

    const events: EventItem[] = (data || []).map((row) => ({
      id: row.id,
      universityId: row.institution_id,
      name: row.name,
      description: row.description || '',
      date: row.event_date || '',
      status: mapStatus(row.status),
      createdAt: row.created_at,
      updatedAt: row.updated_at || null,
    }))

    return NextResponse.json(
      { ok: true, data: events },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Error obteniendo eventos:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudieron obtener los eventos.' },
      { status: 500 },
    )
  }
}
