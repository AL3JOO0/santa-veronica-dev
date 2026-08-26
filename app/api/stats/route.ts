import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 10

interface EventCounts {
  studentCount: number
  photoCount: number
}

export async function GET(request: NextRequest) {
  if (!(await getAdminSession(request))) {
    return NextResponse.json({ ok: false, message: 'No autorizado.' }, { status: 401 })
  }

  try {
    const admin = createSupabaseAdminClient()
    const [studentsResult, photosResult] = await Promise.all([
      admin.from('students').select('id, event_id'),
      admin.from('photos').select('student_id'),
    ])

    if (studentsResult.error) throw studentsResult.error
    if (photosResult.error) throw photosResult.error

    const studentToEvent = new Map<string, string>()
    const countsByEvent: Record<string, EventCounts> = {}

    for (const student of studentsResult.data || []) {
      studentToEvent.set(student.id, student.event_id)
      countsByEvent[student.event_id] ||= { studentCount: 0, photoCount: 0 }
      countsByEvent[student.event_id].studentCount += 1
    }

    for (const photo of photosResult.data || []) {
      const eventId = studentToEvent.get(photo.student_id)
      if (!eventId) continue
      countsByEvent[eventId] ||= { studentCount: 0, photoCount: 0 }
      countsByEvent[eventId].photoCount += 1
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          studentsCount: studentsResult.data?.length || 0,
          photosCount: photosResult.data?.length || 0,
          countsByEvent,
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    )
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { ok: false, message: 'No se pudieron obtener las estadísticas.' },
      { status: 500 },
    )
  }
}
