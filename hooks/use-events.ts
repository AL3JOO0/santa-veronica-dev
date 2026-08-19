'use client'

import * as React from 'react'

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/lib/services/events.service'

import type { EventItem } from '@/lib/types'

import type {
  CreateEventInput,
  UpdateEventInput,
} from '@/lib/services/events.service'

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
        console.error(error)

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

  /*
   * =========================================================
   * CREAR
   * =========================================================
   */

  const addEvent =
    React.useCallback(
      async (
        event: CreateEventInput,
      ) => {
        const created =
          await createEvent(event)

        setEvents((prev) => [
          created,
          ...prev,
        ])

        return created
      },
      [],
    )

  /*
   * =========================================================
   * ACTUALIZAR
   * =========================================================
   */

  const editEvent =
    React.useCallback(
      async (
        id: string,
        event: UpdateEventInput,
      ) => {
        const updated =
          await updateEvent(
            id,
            event,
          )

        setEvents((prev) =>
          prev.map((item) =>
            item.id === id
              ? updated
              : item,
          ),
        )

        return updated
      },
      [],
    )

  /*
   * =========================================================
   * ELIMINAR
   * =========================================================
   */

  const removeEvent =
    React.useCallback(
      async (id: string) => {
        await deleteEvent(id)

        setEvents((prev) =>
          prev.filter(
            (item) => item.id !== id,
          ),
        )
      },
      [],
    )

  return {
    events,
    loading,
    error,

    addEvent,
    editEvent,
    removeEvent,

    reload: loadEvents,
  }
}