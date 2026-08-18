"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, ImageIcon, MapPin, Pencil, Plus, Users } from "lucide-react"
import { useStudio } from "@/lib/store"
import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { EventCard } from "@/components/events/event-card"
import { EventDialog } from "@/components/forms/event-dialog"
import { UniversityDialog } from "@/components/forms/university-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotFoundState } from "@/components/shared/not-found-state"
import type { Event } from "@/lib/types"

export function UniversityDetail({ id }: { id: string }) {
  const router = useRouter()
  const { universities, events, students, photos, deleteEvent } = useStudio()
  const university = universities.find((u) => u.id === id)

  const [query, setQuery] = useState("")
  const [uniDialogOpen, setUniDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  const uniEvents = useMemo(
    () => events.filter((e) => e.universityId === id),
    [events, id],
  )

  const filtered = useMemo(
    () => uniEvents.filter((e) => e.name.toLowerCase().includes(query.toLowerCase())),
    [uniEvents, query],
  )

  const totalStudents = useMemo(
    () => students.filter((s) => uniEvents.some((e) => e.id === s.eventId)).length,
    [students, uniEvents],
  )
  const totalPhotos = useMemo(
    () => photos.filter((p) => uniEvents.some((e) => e.id === p.eventId)).length,
    [photos, uniEvents],
  )

  if (!university) {
    return <NotFoundState label="universidad" backHref="/universidades" />
  }

  function openCreate() {
    setEditingEvent(null)
    setEventDialogOpen(true)
  }
  function openEdit(e: Event) {
    setEditingEvent(e)
    setEventDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={university.name}
        description={university.description || "Detalle de la universidad y sus eventos."}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUniDialogOpen(true)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Nuevo evento
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <Avatar className="size-20 rounded-xl">
            <AvatarImage src={university.logo || "/placeholder.svg"} alt="" className="object-cover" />
            <AvatarFallback className="rounded-xl text-lg">
              {university.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-serif text-xl">{university.name}</h2>
              <StatusBadge status={university.status} />
            </div>
            {university.location ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {university.location}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-6 border-t pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <Metric icon={CalendarDays} value={uniEvents.length} label="Eventos" />
            <Metric icon={Users} value={totalStudents} label="Estudiantes" />
            <Metric icon={ImageIcon} value={totalPhotos} label="Fotos" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg">Eventos</h2>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar evento..."
            className="max-w-xs"
          />
        </div>

        {filtered.length === 0 ? (
          uniEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Esta universidad no tiene eventos"
              description="Crea el primer evento para comenzar a registrar estudiantes y fotografías."
              action={
                <Button onClick={openCreate}>
                  <Plus data-icon="inline-start" />
                  Nuevo evento
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Sin resultados"
              description="No hay eventos que coincidan con tu búsqueda."
            />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                studentCount={students.filter((s) => s.eventId === e.id).length}
                photoCount={photos.filter((p) => p.eventId === e.id).length}
                onEdit={() => openEdit(e)}
                onDelete={() => setDeletingEvent(e)}
              />
            ))}
          </div>
        )}
      </div>

      <UniversityDialog
        open={uniDialogOpen}
        onOpenChange={setUniDialogOpen}
        university={university}
      />
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        defaultUniversityId={university.id}
      />
      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(o) => !o && setDeletingEvent(null)}
        title="Eliminar evento"
        description={`¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán sus estudiantes y fotografías.`}
        onConfirm={() => {
          if (deletingEvent) deleteEvent(deletingEvent.id)
          setDeletingEvent(null)
        }}
      />
    </div>
  )
}

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
      <span className="font-serif text-xl tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
