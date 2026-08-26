'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import {
  GraduationCap,
  CalendarDays,
  Users,
  Images,
  Plus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'

import { UniversityDialog } from '@/components/forms/university-dialog'
import { EventDialog } from '@/components/forms/event-dialog'

import { useEvents } from '@/hooks/use-events'
import { useUniversities } from '@/hooks/use-universities'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useEventCounts } from '@/hooks/use-event-counts'

import { Button } from '@/components/ui/button'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'

import { formatDate } from '@/lib/format'

export default function DashboardPage() {
  /*
   * =========================================================
   * DATA
   * =========================================================
   *
   * Universidades, eventos, estudiantes y fotografías
   * vienen todos de Supabase. Ya no depende del store.
   */

  const {
    events,
    loading: eventsLoading,
    reload: reloadEvents,
  } = useEvents()

  const {
    universities,
    loading: universitiesLoading,
    addUniversity,
  } = useUniversities()

  const {
    studentsCount,
    photosCount,
    loading: statsLoading,
  } = useDashboardStats()

  const { getCounts } = useEventCounts()

  /*
   * =========================================================
   * ESTADO DE LOS DIALOGS
   * =========================================================
   */

  const [uniOpen, setUniOpen] =
    React.useState(false)

  const [eventOpen, setEventOpen] =
    React.useState(false)

  /*
   * =========================================================
   * EVENTOS RECIENTES
   * =========================================================
   */

  const recentEvents = React.useMemo(() => {
    return [...events]
      .sort((a, b) =>
        b.createdAt.localeCompare(
          a.createdAt,
        ),
      )
      .slice(0, 4)
  }, [events])

  /*
   * =========================================================
   * UNIVERSIDADES RECIENTES
   * =========================================================
   */

  const recentUniversities =
    React.useMemo(() => {
      return [...universities]
        .sort((a, b) =>
          b.created_at.localeCompare(
            a.created_at,
          ),
        )
        .slice(0, 4)
    }, [universities])

  /*
   * =========================================================
   * CERRAR DIALOG DE EVENTO
   * =========================================================
   *
   * EventDialog crea el evento directamente mediante
   * createEventAction().
   *
   * Por eso, cuando el dialog se cierra, volvemos a consultar
   * Supabase para que el dashboard muestre inmediatamente
   * el evento recién creado.
   */

  const handleEventDialogChange = async (
    open: boolean,
  ) => {
    setEventOpen(open)

    if (!open) {
      await reloadEvents()
    }
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="mx-auto max-w-7xl">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <PageHeader
        title="Panel principal"
        description="Resumen general del estudio: universidades, eventos, estudiantes y fotografías."
      >

        <Button
          variant="outline"
          onClick={() =>
            setEventOpen(true)
          }
        >
          <Plus data-icon="inline-start" />
          Nuevo evento
        </Button>

        <Button
          onClick={() =>
            setUniOpen(true)
          }
        >
          <Plus data-icon="inline-start" />
          Nueva universidad
        </Button>

      </PageHeader>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Universidades"
          value={universities.length}
          hint="registradas"
          icon={GraduationCap}
        />

        <StatCard
          label="Eventos"
          value={events.length}
          hint="en total"
          icon={CalendarDays}
        />

        <StatCard
          label="Estudiantes"
          value={statsLoading ? 0 : studentsCount}
          hint="asociados"
          icon={Users}
        />

        <StatCard
          label="Fotografías"
          value={statsLoading ? 0 : photosCount}
          hint="cargadas"
          icon={Images}
        />

      </div>

      {/* =====================================================
          CONTENIDO
          ===================================================== */}

      <div className="mt-6">

        <div className="flex flex-col gap-6">

          {/* =================================================
              EVENTOS RECIENTES
              ================================================= */}

          <Card>

            <CardHeader>

              <CardTitle>
                Eventos recientes
              </CardTitle>

              <CardDescription>
                Últimos eventos creados en el sistema.
              </CardDescription>

              <CardAction>

                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href="/eventos" />
                  }
                >
                  Ver todos

                  <ArrowRight data-icon="inline-end" />
                </Button>

              </CardAction>

            </CardHeader>

            <CardContent>

              {eventsLoading ? (

                <div className="py-8 text-center text-sm text-muted-foreground">
                  Cargando eventos...
                </div>

              ) : recentEvents.length === 0 ? (

                <div className="py-8 text-center text-sm text-muted-foreground">
                  No hay eventos registrados.
                </div>

              ) : (

                <div className="grid gap-3 sm:grid-cols-2">

                  {recentEvents.map((ev) => {

                    const university =
                      universities.find(
                        (item) =>
                          item.id ===
                          ev.universityId,
                      )

                    /*
                     * Conteo real desde Supabase,
                     * agregado en el cliente por useEventCounts.
                     */

                    const { studentCount } =
                      getCounts(ev.id)

                    return (

                      <Link
                        key={ev.id}
                        href={`/eventos/${ev.id}`}
                        className="group overflow-hidden rounded-xl border transition-colors hover:border-foreground/20 hover:bg-muted/40"
                      >

                        <div className="relative aspect-[16/9] overflow-hidden">

                          <Image
                            src="/placeholder.svg"
                            alt={ev.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                        </div>

                        <div className="flex flex-col gap-1 p-3">

                          <div className="flex items-center justify-between gap-2">

                            <span className="truncate text-sm font-medium">
                              {ev.name}
                            </span>

                            <StatusBadge
                              status={ev.status}
                            />

                          </div>

                          <span className="truncate text-xs text-muted-foreground">

                            {university?.name ??
                              'Universidad no encontrada'}

                            {' · '}

                            {studentCount} estudiantes

                          </span>

                        </div>

                      </Link>

                    )
                  })}

                </div>

              )}

            </CardContent>

          </Card>

          {/* =================================================
              UNIVERSIDADES RECIENTES
              ================================================= */}

          <Card>

            <CardHeader>

              <CardTitle>
                Universidades recientes
              </CardTitle>

              <CardDescription>
                Instituciones agregadas recientemente.
              </CardDescription>

              <CardAction>

                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href="/universidades" />
                  }
                >
                  Ver todas

                  <ArrowRight data-icon="inline-end" />
                </Button>

              </CardAction>

            </CardHeader>

            <CardContent className="flex flex-col divide-y">

              {universitiesLoading ? (

                <div className="py-6 text-center text-sm text-muted-foreground">
                  Cargando universidades...
                </div>

              ) : recentUniversities.length === 0 ? (

                <div className="py-6 text-center text-sm text-muted-foreground">
                  No hay universidades registradas.
                </div>

              ) : (

                recentUniversities.map((university) => {

                  /*
                   * Contamos los eventos desde Supabase.
                   */

                  const eventCount =
                    events.filter(
                      (event) =>
                        event.universityId ===
                        university.id,
                    ).length

                  return (

                    <Link
                      key={university.id}
                      href={`/universidades/${university.id}`}
                      className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >

                      <Avatar className="size-10 rounded-lg">

                        <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
                          {university.short_name}
                        </AvatarFallback>

                      </Avatar>

                      <div className="flex min-w-0 flex-col">

                        <span className="truncate text-sm font-medium">
                          {university.name}
                        </span>

                        <span className="truncate text-xs text-muted-foreground">

                          {university.location ||
                            'Sin ubicación'}

                          {' · '}

                          {eventCount} eventos

                        </span>

                      </div>

                      <span className="ml-auto text-xs text-muted-foreground">

                        {formatDate(
                          university.created_at,
                        )}

                      </span>

                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />

                    </Link>

                  )
                })

              )}

            </CardContent>

          </Card>

        </div>

      </div>

      {/* =====================================================
          DIALOG UNIVERSIDAD
          ===================================================== */}

      <UniversityDialog
  open={uniOpen}
  onOpenChange={setUniOpen}
  onSubmit={async (university) => {
    await addUniversity(university)
  }}
/>

      {/* =====================================================
          DIALOG EVENTO
          ===================================================== */}

      <EventDialog
        open={eventOpen}
        onOpenChange={handleEventDialogChange}
      />

    </div>
  )
}
