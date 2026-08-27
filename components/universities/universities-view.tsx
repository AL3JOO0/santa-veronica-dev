"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Building2,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react"

import { useUniversities } from "@/hooks/use-universities"

import { PageHeader } from "@/components/shared/page-header"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { UniversityCard } from "@/components/universities/university-card"
import { UniversityDialog } from "@/components/forms/university-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { RowActions } from "@/components/shared/row-actions"

import { Button } from "@/components/ui/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Card } from "@/components/ui/card"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import { formatDate } from "@/lib/format"

import type { University } from "@/lib/types"

import type {
  CreateUniversityInput,
} from "@/lib/services/universities.service"
import { useEvents } from "@/hooks/use-events"

type ActiveFilter = "all" | "active" | "inactive"
type ViewMode = "grid" | "table"

export function UniversitiesView() {
  /*
   * =========================================================
   * UNIVERSIDADES
   * =========================================================
   */

  const {
    universities,
    loading,
    error,
    addUniversity,
    editUniversity,
    removeUniversity,
    reload,
  } = useUniversities()

  /*
   * =========================================================
   * EVENTOS
   * =========================================================
   *
   * Temporalmente los eventos siguen en el store.
   */

  const {
  events,
} = useEvents()

  /*
   * =========================================================
   * ESTADO DE LA INTERFAZ
   * =========================================================
   */

  const [query, setQuery] = useState("")

  const [activeFilter, setActiveFilter] =
    useState<ActiveFilter>("all")

  const [view, setView] =
    useState<ViewMode>("grid")

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editing, setEditing] =
    useState<University | null>(null)

  const [deleting, setDeleting] =
    useState<University | null>(null)

  /*
   * =========================================================
   * EVENTOS POR UNIVERSIDAD
   * =========================================================
   */

  const eventCountByUni = useMemo(() => {
    const map = new Map<string, number>()

    for (const event of events) {
      map.set(
        event.universityId,
        (map.get(event.universityId) ?? 0) + 1,
      )
    }

    return map
  }, [events])

  /*
   * =========================================================
   * FILTRADO DE UNIVERSIDADES
   * =========================================================
   */

  const filteredUniversities = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase()

    return universities.filter((university) => {
      const matchesQuery =
        university.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        (university.location ?? "")
          .toLowerCase()
          .includes(normalizedQuery)

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" &&
          university.active) ||
        (activeFilter === "inactive" &&
          !university.active)

      return matchesQuery && matchesActive
    })
  }, [
    universities,
    query,
    activeFilter,
  ])

  /*
   * =========================================================
   * CREAR UNIVERSIDAD
   * =========================================================
   */

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  /*
   * =========================================================
   * EDITAR UNIVERSIDAD
   * =========================================================
   */

  function openEdit(university: University) {
    setEditing(university)
    setDialogOpen(true)
  }

  /*
   * =========================================================
   * GUARDAR UNIVERSIDAD
   * =========================================================
   *
   * El Dialog solamente recoge los datos.
   *
   * Aquí decidimos si debemos:
   *
   * - crear
   * - actualizar
   */

  async function handleUniversitySubmit(
    data: CreateUniversityInput,
  ) {
    if (editing) {
      await editUniversity(
        editing.id,
        data,
      )
    } else {
      await addUniversity(data)
    }
  }

  /*
   * =========================================================
   * ELIMINAR UNIVERSIDAD
   * =========================================================
   */

  async function handleDelete() {
    if (!deleting) {
      return
    }

    try {
      await removeUniversity(deleting.id)

      setDeleting(null)
    } catch (error) {
      console.error(
        "Error eliminando universidad:",
        error,
      )
    }
  }

  /*
   * =========================================================
   * ESTADO DE CARGA
   * =========================================================
   */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          Cargando universidades...
        </p>
      </div>
    )
  }

  /*
   * =========================================================
   * ESTADO DE ERROR
   * =========================================================
   */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">

        <Building2 className="size-10 text-muted-foreground" />

        <p className="text-sm text-destructive">
          No se pudieron cargar las universidades.
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
   * RENDER PRINCIPAL
   * =========================================================
   */

  return (
    <div className="flex flex-col gap-6">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex items-center justify-between">

        <PageHeader
          title="Universidades"
          description="Gestiona las instituciones registradas en el estudio."
        />

        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Nueva universidad
        </Button>

      </div>

      {/* =====================================================
          FILTROS
          ===================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar universidad..."
            className="sm:max-w-xs"
          />

          <div className="flex items-center gap-2">

            <Button
              type="button"
              variant={
                activeFilter === "all"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() =>
                setActiveFilter("all")
              }
            >
              Todas
            </Button>

            <Button
              type="button"
              variant={
                activeFilter === "active"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() =>
                setActiveFilter("active")
              }
            >
              Activas
            </Button>

            <Button
              type="button"
              variant={
                activeFilter === "inactive"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() =>
                setActiveFilter("inactive")
              }
            >
              Inactivas
            </Button>

          </div>

        </div>

        {/* CAMBIO DE VISTA */}

        <ToggleGroup
          value={[view]}
          onValueChange={(value) => {
            const selectedView = value[0]

            if (
              selectedView === "grid" ||
              selectedView === "table"
            ) {
              setView(selectedView)
            }
          }}
          className="self-start"
        >

          <ToggleGroupItem
            value="grid"
            aria-label="Vista de tarjetas"
          >
            <LayoutGrid />
          </ToggleGroupItem>

          <ToggleGroupItem
            value="table"
            aria-label="Vista de tabla"
          >
            <List />
          </ToggleGroupItem>

        </ToggleGroup>

      </div>

      {/* =====================================================
          CONTENIDO
          ===================================================== */}

      {filteredUniversities.length === 0 ? (

        universities.length === 0 ? (

          <EmptyState
            icon={Building2}
            title="Aún no hay universidades"
            description="Crea tu primera universidad para empezar a organizar eventos y fotografías."
          >
            <Button onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Nueva universidad
            </Button>
          </EmptyState>

        ) : (

          <EmptyState
            icon={Building2}
            title="Sin resultados"
            description="No encontramos universidades que coincidan con tu búsqueda."
          />

        )

      ) : view === "grid" ? (

        /* ===================================================
           VISTA GRID
           =================================================== */

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filteredUniversities.map((university) => (

            <UniversityCard
              key={university.id}
              university={university}
              eventCount={
                eventCountByUni.get(
                  university.id,
                ) ?? 0
              }
              onEdit={() =>
                openEdit(university)
              }
              onDelete={() =>
                setDeleting(university)
              }
            />

          ))}

        </div>

      ) : (

        /* ===================================================
           VISTA TABLA
           =================================================== */

        <Card className="overflow-hidden py-0">

          <Table>

            <TableHeader>

              <TableRow>

                <TableHead>
                  Universidad
                </TableHead>

                <TableHead className="hidden md:table-cell">
                  Ubicación
                </TableHead>

                <TableHead className="text-center">
                  Eventos
                </TableHead>

                <TableHead className="hidden sm:table-cell">
                  Creación
                </TableHead>

                <TableHead>
                  Estado
                </TableHead>

                <TableHead className="w-10" />

              </TableRow>

            </TableHeader>

            <TableBody>

              {filteredUniversities.map(
                (university) => (

                  <TableRow
                    key={university.id}
                  >

                    <TableCell>

                      <Link
                        href={`/universidades/${university.id}`}
                        className="flex items-center gap-3 font-medium hover:underline"
                      >

                        <Avatar className="size-9 rounded-md">

                          <AvatarFallback className="rounded-md">
                            {university.short_name}
                          </AvatarFallback>

                        </Avatar>

                        {university.name}

                      </Link>

                    </TableCell>

                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {university.location || "—"}
                    </TableCell>

                    <TableCell className="text-center tabular-nums">
                      {eventCountByUni.get(
                        university.id,
                      ) ?? 0}
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(
                        university.created_at,
                      )}
                    </TableCell>

                    <TableCell>

                      <span
                        className={
                          university.active
                            ? "text-xs font-medium text-green-600"
                            : "text-xs font-medium text-muted-foreground"
                        }
                      >
                        {university.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>

                    </TableCell>

                    <TableCell>

                      <RowActions
                        viewHref={`/universidades/${university.id}`}
                        onEdit={() =>
                          openEdit(university)
                        }
                        onDelete={() =>
                          setDeleting(university)
                        }
                      />

                    </TableCell>

                  </TableRow>

                ),
              )}

            </TableBody>

          </Table>

        </Card>

      )}

      {/* =====================================================
          DIALOG CREAR / EDITAR
          ===================================================== */}

      <UniversityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        university={editing ?? undefined}
        onSubmit={handleUniversitySubmit}
      />

      {/* =====================================================
          CONFIRMAR ELIMINACIÓN
          ===================================================== */}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null)
          }
        }}
        title="Eliminar universidad"
        description={`¿Seguro que deseas eliminar "${deleting?.name}"? Se eliminarán también sus eventos, estudiantes y fotografías.`}
        onConfirm={handleDelete}
      />

    </div>
  )
}
