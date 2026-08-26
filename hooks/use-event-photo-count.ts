'use client'

import * as React from 'react'

import { getDashboardStats } from '@/lib/services/stats.service'

/**
 * Cuenta las fotografías de un conjunto de estudiantes
 * (por ejemplo, todos los de un evento).
 */
export function useEventPhotoCount(eventId: string) {
  const [count, setCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  // Clave estable para el efecto: solo recalculamos si
  // el conjunto de IDs realmente cambió.
  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const stats = await getDashboardStats()
        const result = stats.countsByEvent[eventId]?.photoCount ?? 0
        if (!cancelled) {
          setCount(result)
        }
      } catch (error) {
        console.error('Error cargando conteo de fotografías:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [eventId])

  return { count, loading }
}
