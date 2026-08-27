import { NextRequest, NextResponse } from 'next/server'

import { getAdminSession, getRequestSession, getStudentSession } from '@/lib/server/auth-guards'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const signedSession = getRequestSession(request)
  const session = signedSession?.userType === 'ADMINISTRADOR'
    ? await getAdminSession(request)
    : await getStudentSession(request)

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    session: {
      profileId: session.profileId,
      identifier: session.identifier,
      userType: session.userType,
      displayName: session.displayName,
      role: session.role,
      documentNumber: session.documentNumber,
      eventName: session.eventName,
      studentStatus: session.studentStatus,
    },
  })
}
