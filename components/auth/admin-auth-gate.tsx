'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { getSession } from '@/lib/services/auth.service'

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    let active = true

    getSession()
      .then((session) => {
        if (!active) return

        if (!session) {
          router.replace('/login')
          return
        }

        if (session.userType === 'ESTUDIANTE') {
          router.replace('/cliente/galeria')
          return
        }

        setAuthorized(true)
      })
      .catch(() => {
        if (active) router.replace('/login')
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [router])

  if (checking || !authorized) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Validando acceso...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
