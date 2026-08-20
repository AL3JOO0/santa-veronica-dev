'use client'

import * as React from 'react'

import {
  getEvents,
} from '@/lib/services/events.service'

import type { EventItem } from '@/lib/types'

export function useEvents() {
  const [events, setEvents] =
    React.useState<EventItem[]>([])

  const [loading, setLoading] =
    React.useState(true)

  const [error, setError] =
    React.useState<string | null>(null)

  /*
   * =========================================================
   * CARGAR EVENTOS
   * =========================================================
   */

  const loadEvents =
    React.useCallback(async () => {
      try {
        setLoading(true)
        setError(null)

        const data =
          await getEvents()

        setEvents(data)

      } catch (error) {
        console.error(
          'Error cargando eventos:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los eventos',
        )

      } finally {
        setLoading(false)
      }
    }, [])

  /*
   * =========================================================
   * CARGA INICIAL
   * =========================================================
   */

  React.useEffect(() => {
    loadEvents()
  }, [loadEvents])

  return {
    events,
    loading,
    error,
    reload: loadEvents,
  }
}