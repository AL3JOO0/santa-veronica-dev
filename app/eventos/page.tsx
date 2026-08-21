'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useEvents } from '@/hooks/use-events'
import { useStore } from '@/lib/store'

import { EventCard } from '@/components/events/event-card'
import { EventDialog } from '@/components/forms/event-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/empty-state'

import { Button } from '@/components/ui/button'

import type { EventItem } from '@/lib/types'
import { useUniversities } from '@/hooks/use-universities'

export default function EventosPage() {

  /*
   * =========================================================
   * EVENTOS
   * =========================================================
   */

  const {
    events,
    loading,
    error,
    reload,
    removeEvent,
  } = useEvents()
  const {
  universities,
  loading: universitiesLoading,
  error: universitiesError,
} = useUniversities()
  /*
   * =========================================================
   * STORE
   * =========================================================
   *
   * Estudiantes y fotografías todavía utilizan
   * el store.
   */

  const {
    students,
    photos,
  } = useStore()

  /*
   * =========================================================
   * ESTADO DE UI
   * =========================================================
   */

  const [query, setQuery] =
    React.useState('')

  const [editingEvent, setEditingEvent] =
    React.useState<EventItem | undefined>()

  const [deletingEvent, setDeletingEvent] =
    React.useState<EventItem | null>(null)

  const [eventDialogOpen, setEventDialogOpen] =
    React.useState(false)

  /*
   * =========================================================
   * FILTRAR EVENTOS
   * =========================================================
   */

  const filteredEvents =
    React.useMemo(() => {

      const normalizedQuery =
        query.trim().toLowerCase()

      if (!normalizedQuery) {
        return events
      }

      return events.filter(
        (event) =>
          event.name
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      )

    }, [
      events,
      query,
    ])

  /*
   * =========================================================
   * EDITAR EVENTO
   * =========================================================
   */

  function openEditEvent(
    event: EventItem,
  ) {

    setEditingEvent(event)

    setEventDialogOpen(true)
  }

  /*
   * =========================================================
   * CERRAR EVENT DIALOG
   * =========================================================
   */

  function handleEventDialogChange(
    open: boolean,
  ) {

    setEventDialogOpen(open)

    if (!open) {
      setEditingEvent(undefined)
    }
  }

  /*
   * =========================================================
   * ELIMINAR EVENTO
   * =========================================================
   */

  async function handleDeleteEvent() {

    if (!deletingEvent) {
      return
    }

    try {

      await removeEvent(
        deletingEvent.id,
      )

      toast.success(
        'Evento eliminado correctamente.',
      )

      setDeletingEvent(null)

      await reload()

    } catch (error) {

      console.error(
        'Error eliminando evento:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el evento.',
      )
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {

    return (
      <div className="flex items-center justify-center py-20">

        <p className="text-sm text-muted-foreground">
          Cargando eventos...
        </p>

      </div>
    )
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (error) {

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">

        <p className="text-sm text-destructive">
          No se pudieron cargar los eventos.
        </p>

        <p className="text-xs text-muted-foreground">
          {error}
        </p>

        <Button
          variant="outline"
          onClick={reload}
        >
          Intentar nuevamente
        </Button>

      </div>
    )
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="flex flex-col gap-6">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <PageHeader
        title="Eventos"
        description="Gestiona los eventos registrados en el estudio."
        action={

          <Button
            nativeButton={false}
            render={
              <Link href="/universidades" />
            }
          >
            <Plus data-icon="inline-start" />
            Nuevo evento
          </Button>

        }
      />

      {/* =====================================================
          BUSCADOR
          ===================================================== */}

      <div className="flex items-center justify-between gap-3">

        <h2 className="font-serif text-lg">
          Todos los eventos
        </h2>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar evento..."
          className="max-w-xs"
        />

      </div>

      {/* =====================================================
          LISTA
          ===================================================== */}

      {filteredEvents.length === 0 ? (

        <EmptyState
          icon={CalendarDays}
          title={
            events.length === 0
              ? 'No hay eventos'
              : 'Sin resultados'
          }
          description={
            events.length === 0
              ? 'Crea un evento desde una universidad para comenzar.'
              : 'No hay eventos que coincidan con tu búsqueda.'
          }
        />

      ) : (

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {filteredEvents.map(
            (event) => {

              const eventStudents =
                students.filter(
                  (student) =>
                    student.eventId ===
                    event.id,
                )

              const studentIds =
                new Set(
                  eventStudents.map(
                    (student) =>
                      student.id,
                  ),
                )

              const eventPhotos =
                photos.filter(
                  (photo) =>
                    studentIds.has(
                      photo.studentId,
                    ),
                )
                  const university = universities.find(
  (item) =>
    item.id === event.universityId,
)
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  universityName={
                  university?.name
                   }
                  studentCount={
                    eventStudents.length
                  }
                  photoCount={
                    eventPhotos.length
                  }
                  onEdit={() =>
                    openEditEvent(event)
                  }
                  onDelete={() =>
                    setDeletingEvent(
                      event,
                    )
                  }
                />
              )
            },
          )}

        </div>

      )}

      {/* =====================================================
          EDITAR EVENTO
          ===================================================== */}

      {editingEvent ? (

        <EventDialog
          open={eventDialogOpen}
          onOpenChange={
            handleEventDialogChange
          }
          event={editingEvent}
          defaultUniversityId={
            editingEvent.universityId
          }
          onSaved={async () => {

            await reload()

            setEventDialogOpen(false)
            setEditingEvent(undefined)

          }}
        />

      ) : null}

      {/* =====================================================
          ELIMINAR EVENTO
          ===================================================== */}

      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(open) => {

          if (!open) {
            setDeletingEvent(null)
          }

        }}
        title="Eliminar evento"
        description={
          `¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán sus estudiantes y fotografías.`
        }
        onConfirm={
          handleDeleteEvent
        }
      />

    </div>
  )
}