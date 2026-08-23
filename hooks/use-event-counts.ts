'use client'

import * as React from 'react'

import { getStudentEventMap } from '@/lib/services/students.service'
import { getAllPhotoStudentIds } from '@/lib/services/photos.service'

export interface EventCounts {
  studentCount: number
  photoCount: number
}

const EMPTY_COUNTS: EventCounts = { studentCount: 0, photoCount: 0 }

/**
 * Trae, para TODOS los eventos, cuántos estudiantes y
 * cuántas fotografías tiene cada uno. Pensado para listados
 * (grid de eventos, "eventos recientes" del dashboard),
 * donde mostrar cada tarjeta con una consulta individual
 * sería lento si hay muchos eventos.
 */
export function useEventCounts() {
  const [countsByEvent, setCountsByEvent] = React.useState<
    Record<string, EventCounts>
  >({})

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [studentMap, photoStudentIds] = await Promise.all([
        getStudentEventMap(),
        getAllPhotoStudentIds(),
      ])

      const studentToEvent: Record<string, string> = {}
      const counts: Record<string, EventCounts> = {}

      for (const { id, eventId } of studentMap) {
        studentToEvent[id] = eventId

        if (!counts[eventId]) {
          counts[eventId] = { studentCount: 0, photoCount: 0 }
        }

        counts[eventId].studentCount += 1
      }

      for (const studentId of photoStudentIds) {
        const eventId = studentToEvent[studentId]
        if (!eventId) continue

        if (!counts[eventId]) {
          counts[eventId] = { studentCount: 0, photoCount: 0 }
        }

        counts[eventId].photoCount += 1
      }

      setCountsByEvent(counts)
    } catch (err) {
      console.error('Error cargando conteos por evento:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los conteos por evento',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  const getCounts = React.useCallback(
    (eventId: string): EventCounts => {
      return countsByEvent[eventId] ?? EMPTY_COUNTS
    },
    [countsByEvent],
  )

  return { getCounts, loading, error, reload }
}