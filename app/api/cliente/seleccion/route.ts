import { NextRequest, NextResponse } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
} from '@/lib/server/app-session'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
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

    const body = (await request.json().catch(() => null)) as
      | { photoIds?: string[] }
      | null

    const photoIds = Array.from(
      new Set((body?.photoIds || []).filter((id) => typeof id === 'string')),
    )

    if (photoIds.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Selecciona al menos una fotografía.' },
        { status: 400 },
      )
    }

    if (photoIds.length > 500) {
      return NextResponse.json(
        { ok: false, message: 'La selección supera el límite permitido.' },
        { status: 400 },
      )
    }

    const admin = createSupabaseAdminClient()

    const { data: ownedPhotos, error: ownedError } = await admin
      .from('photos')
      .select('id')
      .eq('student_id', session.profileId)
      .in('id', photoIds)

    if (ownedError || (ownedPhotos || []).length !== photoIds.length) {
      return NextResponse.json(
        { ok: false, message: 'La selección contiene fotografías no válidas.' },
        { status: 400 },
      )
    }

    const { data: latestSelection, error: selectionLookupError } = await admin
      .from('selections')
      .select('id, status')
      .eq('student_id', session.profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (selectionLookupError) {
      throw selectionLookupError
    }

    if (latestSelection?.status === 'SUBMITTED') {
      return NextResponse.json(
        { ok: false, message: 'Tu selección ya fue enviada.' },
        { status: 409 },
      )
    }

    let selectionId = latestSelection?.id

    if (!selectionId) {
      const { data: createdSelection, error: createError } = await admin
        .from('selections')
        .insert({
          student_id: session.profileId,
          status: 'DRAFT',
        })
        .select('id')
        .single()

      if (createError) throw createError
      selectionId = createdSelection.id
    }

    const { error: deleteError } = await admin
      .from('selection_photos')
      .delete()
      .eq('selection_id', selectionId)

    if (deleteError) throw deleteError

    const { error: insertError } = await admin.from('selection_photos').insert(
      photoIds.map((photoId) => ({
        selection_id: selectionId,
        photo_id: photoId,
      })),
    )

    if (insertError) throw insertError

    const now = new Date().toISOString()

    const { error: submitError } = await admin
      .from('selections')
      .update({
        status: 'SUBMITTED',
        submitted_at: now,
        updated_at: now,
      })
      .eq('id', selectionId)

    if (submitError) throw submitError

    const { error: studentError } = await admin
      .from('students')
      .update({
        status: 'SELECTION_SENT',
        updated_at: now,
      })
      .eq('id', session.profileId)

    if (studentError) throw studentError

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
