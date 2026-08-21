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
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { UniversityDialog } from '@/components/forms/university-dialog'
import { EventDialog } from '@/components/forms/event-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useStore } from '@/lib/store'
import { formatDate } from '@/lib/format'

export default function DashboardPage() {
  const store = useStore()
  const [uniOpen, setUniOpen] = React.useState(false)
  const [eventOpen, setEventOpen] = React.useState(false)

  const recentEvents = [...(store.events || [])]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 4)

  const recentUniversities = [...(store.universities || [])]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Panel principal"
        description="Resumen general del estudio: universidades, eventos, estudiantes y fotografías."
      >
        <Button variant="outline" onClick={() => setEventOpen(true)}>
          <Plus data-icon="inline-start" />
          Nuevo evento
        </Button>
        <Button onClick={() => setUniOpen(true)}>
          <Plus data-icon="inline-start" />
          Nueva universidad
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Universidades"
          value={store.universities?.length || 0}
          hint="registradas"
          icon={GraduationCap}
        />
        <StatCard
          label="Eventos"
          value={store.events?.length || 0}
          hint="en total"
          icon={CalendarDays}
        />
        <StatCard
          label="Estudiantes"
          value={store.students?.length || 0}
          hint="asociados"
          icon={Users}
        />
        <StatCard
          label="Fotografías"
          value={store.photos?.length || 0}
          hint="cargadas"
          icon={Images}
        />
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos recientes</CardTitle>
              <CardDescription>
                Últimos eventos creados en el sistema.
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/eventos" />}
                >
                  Ver todos
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {recentEvents.map((ev) => {
                const uni = store.getUniversity?.(ev.universityId)
                const count = store.studentsByEvent?.(ev.id)?.length || 0
                return (
                  <Link
                    key={ev.id}
                    href={`/eventos/${ev.id}`}
                    className="group overflow-hidden rounded-xl border transition-colors hover:border-foreground/20 hover:bg-muted/40"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={ev.cover || '/placeholder.svg'}
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
                        <StatusBadge status={ev.status} />
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {uni?.name} · {count} estudiantes
                      </span>
                    </div>
                  </Link>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Universidades recientes</CardTitle>
              <CardDescription>
                Instituciones agregadas recientemente.
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/universidades" />}
                >
                  Ver todas
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {recentUniversities.map((u) => {
                const count = store.eventsByUniversity?.(u.id)?.length || 0
                return (
                  <Link
                    key={u.id}
                    href={`/universidades/${u.id}`}
                    className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
                        {u.short_name}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {u.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {u.location} · {count} eventos
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <UniversityDialog open={uniOpen} onOpenChange={setUniOpen} />
      <EventDialog open={eventOpen} onOpenChange={setEventOpen} />
    </div>
  )
}