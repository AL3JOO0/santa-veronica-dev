import { NextRequest, NextResponse } from 'next/server'

import {
  APP_SESSION_COOKIE,
  readAppSessionToken,
} from '@/lib/server/app-session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = readAppSessionToken(
    request.cookies.get(APP_SESSION_COOKIE)?.value,
  )

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
