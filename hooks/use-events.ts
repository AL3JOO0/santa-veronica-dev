'use client'

import * as React from 'react'

import {
  getEvents,
  updateEvent,
  deleteEvent,
} from '@/lib/services/events.service'

import type {
  EventItem,
} from '@/lib/types'

import type {
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
   * EDITAR EVENTO
   * =========================================================
   */

  const editEvent =
    React.useCallback(
      async (
        id: string,
        input: UpdateEventInput,
      ) => {
        try {
          setError(null)

          const updatedEvent =
            await updateEvent(id, input)

          setEvents((currentEvents) =>
            currentEvents.map((event) =>
              event.id === id
                ? updatedEvent
                : event,
            ),
          )

          return updatedEvent
        } catch (error) {
          console.error(
            'Error editando evento:',
            error,
          )

          const message =
            error instanceof Error
              ? error.message
              : 'No se pudo editar el evento'

          setError(message)

          throw error
        }
      },
      [],
    )
      const removeEvent =
  React.useCallback(
    async (id: string) => {
      try {
        setError(null)

        await deleteEvent(id)

        setEvents((currentEvents) =>
          currentEvents.filter(
            (event) => event.id !== id,
          ),
        )
      } catch (error) {
        console.error(
          'Error eliminando evento:',
          error,
        )

        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo eliminar el evento'

        setError(message)

        throw error
      }
    },
    [],
  )
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
    editEvent,
    removeEvent,
  }
}
