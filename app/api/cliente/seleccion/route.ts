import { after, NextRequest, NextResponse } from 'next/server'

import { getStudentSession } from '@/lib/server/auth-guards'
import { isSameOriginRequest } from '@/lib/server/request-security'
import { notifySelectionSubmitted } from '@/lib/server/selection-email'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { firstZodError, selectionSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function POST(request: NextRequest) {
  try {
    const session = await getStudentSession(request)
    if (!session) {
      return NextResponse.json(
        { ok: false, message: 'Tu sesión ha expirado.' },
        { status: 401 },
      )
    }
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ ok: false, message: 'Origen no permitido.' }, { status: 403 })
    }

    const parsed = selectionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: firstZodError(parsed.error) },
        { status: 400 },
      )
    }
    const photoIds = Array.from(new Set(parsed.data.photoIds))
    const admin = createSupabaseAdminClient()

    const { data: ownedPhotos, error: ownedError } = await admin
      .from('photos')
      .select('id, original_filename')
      .eq('student_id', session.profileId)
      .in('id', photoIds)

    if (ownedError || (ownedPhotos || []).length !== photoIds.length) {
      return NextResponse.json(
        { ok: false, message: 'La selección contiene fotografías no válidas.' },
        { status: 400 },
      )
    }

    const { data: selectionId, error: submitError } = await admin.rpc(
      'submit_student_selection',
      { p_student_id: session.profileId, p_photo_ids: photoIds },
    )

    if (submitError) {
      if (submitError.message.includes('SELECTION_ALREADY_SUBMITTED')) {
        return NextResponse.json(
          { ok: false, message: 'Tu selección ya fue enviada.' },
          { status: 409 },
        )
      }
      throw submitError
    }

    after(async () => {
      await notifySelectionSubmitted({
        admin,
        selectionId: String(selectionId),
        studentId: session.profileId,
        photos: ownedPhotos || [],
      }).catch((error) => {
        console.error('No fue posible procesar la notificación por correo:', error)
      })
    })

    return NextResponse.json({
      ok: true,
      selectedIds: photoIds,
      message: 'Selección enviada correctamente.',
    })
  } catch (error) {
    console.error('Error guardando selección:', error)
    return NextResponse.json(
      { ok: false, message: 'No fue posible guardar la selección.' },
      { status: 500 },
    )
  }
}
