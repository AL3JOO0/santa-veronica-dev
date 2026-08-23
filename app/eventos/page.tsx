'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { useEvents } from '@/hooks/use-events'
import { useEventCounts } from "@/hooks/use-event-counts"
import { useUniversities } from '@/hooks/use-universities'

import { EventCard } from '@/components/events/event-card'
import { EventDialog } from '@/components/forms/event-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { EmptyState } from '@/components/shared/empty-state'

import { Button } from '@/components/ui/button'

import type { EventItem } from '@/lib/types'

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
    reload: reloadUniversities,
  } = useUniversities()

  // 👇 Aquí está la corrección: inicializamos getCounts desde el hook
  const { getCounts } = useEventCounts()

  /*
   * =========================================================
   * STORE
   * =========================================================
   *
   * Estudiantes y fotografías todavía utilizan
   * el store.
   */



  /*
   * =========================================================
   * ESTADO DE UI
   * =========================================================
   */

  const [query, setQuery] = React.useState('')

  const [editingEvent, setEditingEvent] = React.useState<EventItem | undefined>()

  const [deletingEvent, setDeletingEvent] = React.useState<EventItem | null>(null)

  const [eventDialogOpen, setEventDialogOpen] = React.useState(false)

  /*
   * =========================================================
   * FILTRAR EVENTOS
   * =========================================================
   */

  const filteredEvents = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return events
    }

    return events.filter((event) =>
      event.name.toLowerCase().includes(normalizedQuery),
    )
  }, [events, query])

  function openCreateEvent() {
    setEditingEvent(undefined)
    setEventDialogOpen(true)
  }

  /*
   * =========================================================
   * EDITAR EVENTO
   * =========================================================
   */

  function openEditEvent(event: EventItem) {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  /*
   * =========================================================
   * CERRAR EVENT DIALOG
   * =========================================================
   */

  function handleEventDialogChange(open: boolean) {
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
      await removeEvent(deletingEvent.id)
      toast.success('Evento eliminado correctamente.')
      setDeletingEvent(null)
      await reload()
    } catch (error) {
      console.error('Error eliminando evento:', error)
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

  if (loading || universitiesLoading) {
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
        <Button variant="outline" onClick={reload}>
          Intentar nuevamente
        </Button>
      </div>
    )
  }

  if (universitiesError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-destructive">
          No se pudieron cargar las universidades.
        </p>
        <p className="text-xs text-muted-foreground">
          {universitiesError}
        </p>
        <Button variant="outline" onClick={reloadUniversities}>
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
      <PageHeader
        title="Eventos"
        description="Gestiona los eventos registrados en el estudio."
        action={
          <Button onClick={openCreateEvent}>
            <Plus className="mr-2 size-4" />
            Nuevo evento
          </Button>
        }
      />

      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-lg">
          Todos los eventos
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({filteredEvents.length})
          </span>
        </h2>

        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar evento..."
          className="w-full sm:max-w-xs"
        />
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={events.length === 0 ? 'No hay eventos' : 'Sin resultados'}
          description={
            events.length === 0
              ? 'Crea tu primer evento con el botón "Nuevo evento".'
              : 'No hay eventos que coincidan con tu búsqueda.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const university = universities.find(
              (item) => item.id === event.universityId
            )
            // Ya no dará error porque getCounts está definido arriba
            const { studentCount, photoCount } = getCounts(event.id)

            return (
              <EventCard
                key={event.id}
                event={event}
                universityName={university?.name}
                studentCount={studentCount}
                photoCount={photoCount}
                onEdit={() => openEditEvent(event)}
                onDelete={() => setDeletingEvent(event)}
              />
            )
          })}
        </div>
      )}

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={handleEventDialogChange}
        event={editingEvent}
        onSaved={async () => {
          await reload()
          setEventDialogOpen(false)
          setEditingEvent(undefined)
        }}
      />

      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null)
        }}
        title="Eliminar evento"
        description={`¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán sus estudiantes y fotografías.`}
        onConfirm={handleDeleteEvent}
      />
    </div>
  )
}