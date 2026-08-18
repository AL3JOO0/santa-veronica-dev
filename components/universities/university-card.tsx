"use client"

import Link from "next/link"
import { Building2, Calendar } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { RowActions } from "@/components/shared/row-actions"
import { formatDate } from "@/lib/format"
import type { University } from "@/lib/types"

export function UniversityCard({
  university,
  eventCount,
  onEdit,
  onDelete,
}: {
  university: University
  eventCount: number
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <Link
        href={`/universidades/${university.id}`}
        className="block aspect-[16/9] overflow-hidden bg-muted"
        aria-label={`Ver ${university.name}`}
      >
        <div className="flex size-full items-center justify-center">
          <Building2 className="size-10 text-muted-foreground transition-transform duration-500 group-hover:scale-110" />
        </div>
      </Link>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <Link
              href={`/universidades/${university.id}`}
              className="font-medium leading-tight hover:underline"
            >
              {university.name}
            </Link>

            {university.location ? (
              <span className="text-sm text-muted-foreground">
                {university.location}
              </span>
            ) : null}
          </div>

          <RowActions
            viewHref={`/universidades/${university.id}`}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />

            <span>
              {eventCount}{" "}
              {eventCount === 1 ? "evento" : "eventos"}
            </span>
          </div>

          <span
            className={
              university.active
                ? "text-xs font-medium text-green-600"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {university.active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Creada el {formatDate(university.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}