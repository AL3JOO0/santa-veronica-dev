"use client"

import Link from "next/link"
import { CalendarDays, ImageIcon, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { RowActions } from "@/components/shared/row-actions"
import { formatDate } from "@/lib/format"
import type { EventItem } from "@/lib/types"

export function EventCard({
  event,
  studentCount,
  photoCount,
  universityName,
  onEdit,
  onDelete,
}: {
  event: EventItem
  studentCount: number
  photoCount: number
  universityName?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <Link
        href={`/eventos/${event.id}`}
        className="relative block aspect-[16/10] overflow-hidden bg-muted"
        aria-label={`Ver ${event.name}`}
      >
        <Link
  href={`/eventos/${event.id}`}
  className="relative block aspect-[16/10] overflow-hidden bg-muted"
  aria-label={`Ver ${event.name}`}
>
  <div className="flex size-full items-center justify-center">
    <CalendarDays className="size-10 text-muted-foreground" />
  </div>

  <div className="absolute left-3 top-3">
    <StatusBadge status={event.status} />
  </div>
</Link>
        <div className="absolute left-3 top-3">
          <StatusBadge status={event.status} />
        </div>
      </Link>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Link
              href={`/eventos/${event.id}`}
              className="font-medium leading-tight hover:underline"
            >
              {event.name}
            </Link>
            {universityName ? (
              <span className="text-sm text-muted-foreground">{universityName}</span>
            ) : null}
          </div>
          <RowActions viewHref={`/eventos/${event.id}`} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {studentCount}
          </span>
          <span className="flex items-center gap-1.5">
            <ImageIcon className="size-4" />
            {photoCount}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
