"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Users,
} from "lucide-react"

import { useStore } from "@/lib/store"
import { useUniversities } from "@/hooks/use-universities"

import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { EventCard } from "@/components/events/event-card"
import { EventDialog } from "@/components/forms/event-dialog"
import { UniversityDialog } from "@/components/forms/university-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { NotFoundState } from "@/components/shared/not-found-state"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import type { Event } from "@/lib/types"
import type { CreateUniversityInput } from "@/lib/services/universities.service"

interface Props {
  id: string
}

export function UniversityDetail({ id }: Props) {
  /*
   * =========================================================
   * UNIVERSIDADES
   * =========================================================
   *
   * El CRUD de universidades pasa por useUniversities().
   */
  const {
    universities,
    loading: universitiesLoading,
    error: universitiesError,
    editUniversity,
    reload,
  } = useUniversities()

  /*
   * =========================================================
   * EVENTOS / ESTUDIANTES / FOTOS
   * =========================================================
   *
   * Estos todavía permanecen en el store.
   *
   * Posteriormente podremos migrarlos a sus respectivos hooks.
   */
  const {
    events,
    students,
    photos,
    deleteEvent,
  } = useStore()

  /*
   * =========================================================
   * UNIVERSIDAD ACTUAL
   * =========================================================
   */

  const university = universities.find(
    (item) => item.id === id,
  )

  /*
   * =========================================================
   * ESTADO DE UI
   * =========================================================
   */

  const [query, setQuery] = useState("")

  const [uniDialogOpen, setUniDialogOpen] =
    useState(false)

  const [eventDialogOpen, setEventDialogOpen] =
    useState(false)

  const [editingEvent, setEditingEvent] =
    useState<Event | null>(null)

  const [deletingEvent, setDeletingEvent] =
    useState<Event | null>(null)

  /*
   * =========================================================
   * EVENTOS DE LA UNIVERSIDAD
   * =========================================================
   */

  const universityEvents = useMemo(() => {
    return events.filter(
      (event) => event.universityId === id,
    )
  }, [events, id])

  /*
   * =========================================================
   * FILTRAR EVENTOS
   * =========================================================
   */

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase()

    if (!normalizedQuery) {
      return universityEvents
    }

    return universityEvents.filter((event) =>
      event.name
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [universityEvents, query])

  /*
   * =========================================================
   * TOTAL ESTUDIANTES
   * =========================================================
   */

  const totalStudents = useMemo(() => {
    const eventIds = new Set(
      universityEvents.map(
        (event) => event.id,
      ),
    )

    return students.filter((student) =>
      eventIds.has(student.eventId),
    ).length
  }, [students, universityEvents])

  /*
   * =========================================================
   * TOTAL FOTOS
   * =========================================================
   */

  const totalPhotos = useMemo(() => {
    const eventIds = new Set(
      universityEvents.map(
        (event) => event.id,
      ),
    )

    return photos.filter((photo) =>
      eventIds.has(photo.eventId),
    ).length
  }, [photos, universityEvents])

  /*
   * =========================================================
   * CREAR EVENTO
   * =========================================================
   */

  function openCreateEvent() {
    setEditingEvent(null)
    setEventDialogOpen(true)
  }

  /*
   * =========================================================
   * EDITAR EVENTO
   * =========================================================
   */

  function openEditEvent(event: Event) {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  /*
   * =========================================================
   * EDITAR UNIVERSIDAD
   * =========================================================
   */

  function openEditUniversity() {
    setUniDialogOpen(true)
  }

  /*
   * =========================================================
   * GUARDAR UNIVERSIDAD
   * =========================================================
   *
   * UniversityDialog
   *        ↓
   * handleUniversitySubmit
   *        ↓
   * editUniversity
   *        ↓
   * service
   *        ↓
   * Supabase
   */

  async function handleUniversitySubmit(
    data: CreateUniversityInput,
  ) {
    if (!university) {
      return
    }

    await editUniversity(
      university.id,
      data,
    )

    /*
     * No es estrictamente necesario si el hook
     * actualiza su estado local.
     *
     * Lo dejamos para garantizar que la vista
     * quede sincronizada.
     */
    await reload()

    setUniDialogOpen(false)
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
      await deleteEvent(
        deletingEvent.id,
      )

      setDeletingEvent(null)
    } catch (error) {
      console.error(
        "Error eliminando evento:",
        error,
      )
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (universitiesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          Cargando universidad...
        </p>
      </div>
    )
  }

  /*
   * =========================================================
   * ERROR
   * =========================================================
   */

  if (universitiesError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-destructive">
          No se pudo cargar la universidad.
        </p>

        <p className="text-xs text-muted-foreground">
          {universitiesError}
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
   * UNIVERSIDAD NO ENCONTRADA
   * =========================================================
   */

  if (!university) {
    return (
      <NotFoundState
        label="universidad"
        backHref="/universidades"
      />
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
        title={university.name}
        description={
          university.description ||
          "Detalle de la universidad y sus eventos."
        }
        action={
          <div className="flex gap-2">

            <Button
              variant="outline"
              onClick={openEditUniversity}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>

            <Button
              onClick={openCreateEvent}
            >
              <Plus data-icon="inline-start" />
              Nuevo evento
            </Button>

          </div>
        }
      />

      {/* =====================================================
          INFORMACIÓN DE UNIVERSIDAD
          ===================================================== */}

      <Card className="overflow-hidden py-0">

        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">

          <Avatar className="size-20 rounded-xl">

            <AvatarImage
              src="/placeholder.svg"
              alt={university.name}
              className="object-cover"
            />

            <AvatarFallback className="rounded-xl text-lg">
              {university.short_name ||
                university.name
                  .slice(0, 2)
                  .toUpperCase()}
            </AvatarFallback>

          </Avatar>

          <div className="flex flex-1 flex-col gap-2">

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="font-serif text-xl">
                {university.name}
              </h2>

              <span
  className={
    university.active
      ? "text-xs font-medium text-green-600"
      : "text-xs font-medium text-muted-foreground"
  }
>
  {university.active
    ? "Activa"
    : "Inactiva"}
</span>

            </div>

            {university.location ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">

                <MapPin className="size-4" />

                {university.location}

              </span>
            ) : null}

          </div>

          <div className="grid grid-cols-3 gap-6 border-t pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">

            <Metric
              icon={CalendarDays}
              value={universityEvents.length}
              label="Eventos"
            />

            <Metric
              icon={Users}
              value={totalStudents}
              label="Estudiantes"
            />

            <Metric
              icon={ImageIcon}
              value={totalPhotos}
              label="Fotos"
            />

          </div>

        </CardContent>

      </Card>

      {/* =====================================================
          EVENTOS
          ===================================================== */}

      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between gap-3">

          <h2 className="font-serif text-lg">
            Eventos
          </h2>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar evento..."
            className="max-w-xs"
          />

        </div>

        {filteredEvents.length === 0 ? (

          universityEvents.length === 0 ? (

            <EmptyState
              icon={CalendarDays}
              title="Esta universidad no tiene eventos"
              description="Crea el primer evento para comenzar a registrar estudiantes y fotografías."
            >
              <Button
                onClick={openCreateEvent}
              >
                <Plus data-icon="inline-start" />
                Nuevo evento
              </Button>
            </EmptyState>

          ) : (

            <EmptyState
              icon={CalendarDays}
              title="Sin resultados"
              description="No hay eventos que coincidan con tu búsqueda."
            />

          )

        ) : (

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {filteredEvents.map((event) => (

              <EventCard
                key={event.id}
                event={event}
                studentCount={
                  students.filter(
                    (student) =>
                      student.eventId ===
                      event.id,
                  ).length
                }
                photoCount={
                  photos.filter(
                    (photo) =>
                      photo.eventId ===
                      event.id,
                  ).length
                }
                onEdit={() =>
                  openEditEvent(event)
                }
                onDelete={() =>
                  setDeletingEvent(event)
                }
              />

            ))}

          </div>

        )}

      </div>

      {/* =====================================================
          DIALOG UNIVERSIDAD
          ===================================================== */}

      <UniversityDialog
        open={uniDialogOpen}
        onOpenChange={setUniDialogOpen}
        university={university}
        onSubmit={handleUniversitySubmit}
      />

      {/* =====================================================
          DIALOG EVENTO
          ===================================================== */}

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        defaultUniversityId={university.id}
      />

      {/* =====================================================
          CONFIRMAR ELIMINACIÓN
          ===================================================== */}

      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEvent(null)
          }
        }}
        title="Eliminar evento"
        description={`¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán sus estudiantes y fotografías.`}
        onConfirm={handleDeleteEvent}
      />

    </div>
  )
}

/*
 * =========================================================
 * MÉTRICA
 * =========================================================
 */

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType
  value: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">

      <Icon className="size-4 text-muted-foreground" />

      <span className="font-serif text-xl tabular-nums">
        {value}
      </span>

      <span className="text-xs text-muted-foreground">
        {label}
      </span>

    </div>
  )
}