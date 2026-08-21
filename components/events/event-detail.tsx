"use client"

import {
  useMemo,
  useState,
} from "react"

import Link from "next/link"

import {
  ArrowLeft,
  CalendarDays,
  ImageIcon,
  MapPin,
  Pencil,
  Users,
} from "lucide-react"

import { toast } from "sonner"

import { useStore } from "@/lib/store"
import { useUniversities } from "@/hooks/use-universities"
import { useEvents } from "@/hooks/use-events"

import { PageHeader } from "@/components/shared/page-header"
import { NotFoundState } from "@/components/shared/not-found-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EventDialog } from "@/components/forms/event-dialog"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { EventItem } from "@/lib/types"

interface Props {
  id: string
}

export function EventDetail({ id }: Props) {

  /*
   * =========================================================
   * STORE
   * =========================================================
   *
   * Estudiantes y fotografías continúan
   * utilizando el store.
   */

  const store = useStore()

  const {
    students,
    photos,
  } = store

  /*
   * =========================================================
   * UNIVERSIDADES
   * =========================================================
   */

  const {
    universities,
    loading: universitiesLoading,
    error: universitiesError,
    reload: reloadUniversities,
  } = useUniversities()

  /*
   * =========================================================
   * EVENTOS
   * =========================================================
   */

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    reload: reloadEvents,
    removeEvent,
  } = useEvents()

  /*
   * =========================================================
   * EVENTO ACTUAL
   * =========================================================
   */

  const event = events.find(
    (item) => item.id === id,
  )

  /*
   * =========================================================
   * UNIVERSIDAD DEL EVENTO
   * =========================================================
   */

  const university = useMemo(() => {

    if (!event) {
      return undefined
    }

    return universities.find(
      (item) =>
        item.id === event.universityId,
    )

  }, [
    universities,
    event,
  ])

  /*
   * =========================================================
   * ESTUDIANTES DEL EVENTO
   * =========================================================
   */

  const eventStudents = useMemo(() => {

    return students.filter(
      (student) =>
        student.eventId === id,
    )

  }, [
    students,
    id,
  ])

  /*
   * =========================================================
   * FOTOGRAFÍAS DEL EVENTO
   * =========================================================
   *
   * Las fotografías se relacionan con los estudiantes.
   */

  const eventPhotos = useMemo(() => {

    const studentIds = new Set(
      eventStudents.map(
        (student) => student.id,
      ),
    )

    return photos.filter(
      (photo) =>
        studentIds.has(
          photo.studentId,
        ),
    )

  }, [
    photos,
    eventStudents,
  ])

  /*
   * =========================================================
   * ESTADO DE UI
   * =========================================================
   */

  const [
    eventDialogOpen,
    setEventDialogOpen,
  ] = useState(false)

  const [
    deletingEvent,
    setDeletingEvent,
  ] = useState<EventItem | null>(null)

  /*
   * =========================================================
   * EDITAR EVENTO
   * =========================================================
   */

  function openEditEvent() {

    setEventDialogOpen(true)

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
        "Evento eliminado correctamente.",
      )

      setDeletingEvent(null)

      /*
       * Actualizamos la lista de eventos
       * después de eliminar.
       */

      await reloadEvents()

    } catch (error) {

      console.error(
        "Error eliminando evento:",
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el evento.",
      )

    }

  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (
    universitiesLoading ||
    eventsLoading
  ) {

    return (
      <div className="flex items-center justify-center py-20">

        <p className="text-sm text-muted-foreground">
          Cargando evento...
        </p>

      </div>
    )

  }

  /*
   * =========================================================
   * ERROR UNIVERSIDADES
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
          onClick={reloadUniversities}
        >
          Intentar nuevamente
        </Button>

      </div>
    )

  }

  /*
   * =========================================================
   * ERROR EVENTOS
   * =========================================================
   */

  if (eventsError) {

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">

        <p className="text-sm text-destructive">
          No se pudieron cargar los eventos.
        </p>

        <p className="text-xs text-muted-foreground">
          {eventsError}
        </p>

        <Button
          variant="outline"
          onClick={reloadEvents}
        >
          Intentar nuevamente
        </Button>

      </div>
    )

  }

  /*
   * =========================================================
   * EVENTO NO ENCONTRADO
   * =========================================================
   */

  if (!event) {

    return (
      <NotFoundState
        label="evento"
        backHref="/eventos"
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
        title={event.name}
        description={
          event.description ||
          "Detalle del evento."
        }
        action={
          <div className="flex gap-2">

            <Button
              variant="outline"
              asChild
            >
              <Link href="/eventos">
                <ArrowLeft data-icon="inline-start" />
                Volver
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={openEditEvent}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>

            <Button
              variant="destructive"
              onClick={() =>
                setDeletingEvent(event)
              }
            >
              Eliminar
            </Button>

          </div>
        }
      />

      {/* =====================================================
          INFORMACIÓN DEL EVENTO
          ===================================================== */}

      <Card className="overflow-hidden py-0">

        <CardContent className="flex flex-col gap-6 p-6">

          <div className="flex flex-col gap-4">

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="font-serif text-xl">
                {event.name}
              </h2>

              <EventStatus
                status={event.status}
              />

            </div>

            {event.description ? (

              <p className="max-w-3xl text-sm text-muted-foreground">
                {event.description}
              </p>

            ) : null}

            <div className="flex flex-wrap gap-x-6 gap-y-3">

              {event.date ? (

                <div className="flex items-center gap-2 text-sm text-muted-foreground">

                  <CalendarDays className="size-4" />

                  <span>
                    {formatDate(event.date)}
                  </span>

                </div>

              ) : null}

              {university ? (

                <Link
                  href={`/universidades/${university.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >

                  <MapPin className="size-4" />

                  <span>
                    {university.name}
                  </span>

                </Link>

              ) : null}

            </div>

          </div>

          {/* =================================================
              MÉTRICAS
              ================================================= */}

          <div className="grid grid-cols-2 gap-6 border-t pt-6 md:grid-cols-3">

            <Metric
              icon={Users}
              value={eventStudents.length}
              label="Estudiantes"
            />

            <Metric
              icon={ImageIcon}
              value={eventPhotos.length}
              label="Fotografías"
            />

            <Metric
              icon={CalendarDays}
              value={1}
              label="Evento"
            />

          </div>

        </CardContent>

      </Card>

      {/* =====================================================
          UNIVERSIDAD
          ===================================================== */}

      {university ? (

        <Card>

          <CardContent className="flex flex-col gap-3 p-6">

            <h2 className="font-serif text-lg">
              Universidad
            </h2>

            <div className="flex flex-col gap-1">

              <Link
                href={`/universidades/${university.id}`}
                className="font-medium hover:underline"
              >
                {university.name}
              </Link>

              {university.location ? (

                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">

                  <MapPin className="size-4" />

                  {university.location}

                </span>

              ) : null}

            </div>

          </CardContent>

        </Card>

      ) : (

        <Card>

          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              La universidad asociada a este evento no fue encontrada.
            </p>

          </CardContent>

        </Card>

      )}

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <Card>

        <CardContent className="p-6">

          <div className="flex flex-col gap-2">

            <h2 className="font-serif text-lg">
              Resumen
            </h2>

            <p className="text-sm text-muted-foreground">
              Este evento tiene{" "}
              <span className="font-medium text-foreground">
                {eventStudents.length}
              </span>{" "}
              estudiante
              {eventStudents.length === 1
                ? ""
                : "s"}{" "}
              registrado
              {eventStudents.length === 1
                ? ""
                : "s"}{" "}
              y{" "}
              <span className="font-medium text-foreground">
                {eventPhotos.length}
              </span>{" "}
              fotografía
              {eventPhotos.length === 1
                ? ""
                : "s"}.
            </p>

          </div>

        </CardContent>

      </Card>

      {/* =====================================================
          DIALOG EVENTO
          ===================================================== */}

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={event}
        defaultUniversityId={
          event.universityId
        }
        onSaved={async () => {

          await reloadEvents()

          setEventDialogOpen(false)

        }}
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
        description={
          `¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán sus estudiantes y fotografías.`
        }
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
  icon: typeof Users
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

/*
 * =========================================================
 * ESTADO DEL EVENTO
 * =========================================================
 */

function EventStatus({
  status,
}: {
  status: EventItem["status"]
}) {

  const config: Record<
    string,
    {
      label: string
      className: string
    }
  > = {
    DRAFT: {
      label: "Borrador",
      className:
        "text-xs font-medium text-muted-foreground",
    },

    ACTIVE: {
      label: "Activo",
      className:
        "text-xs font-medium text-green-600",
    },

    ARCHIVED: {
      label: "Archivado",
      className:
        "text-xs font-medium text-orange-600",
    },
  }

  const current =
    config[String(status)] ?? {
      label: String(status),
      className:
        "text-xs font-medium text-muted-foreground",
    }

  return (
    <span className={current.className}>
      {current.label}
    </span>
  )
}

/*
 * =========================================================
 * FORMATEAR FECHA
 * =========================================================
 */

function formatDate(
  value: string,
) {

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      dateStyle: "long",
    },
  ).format(date)
}