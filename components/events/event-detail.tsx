"use client"

import { useMemo, useRef, useState, type ChangeEvent } from "react"
import Link from "next/link"
import { useStudents } from "@/hooks/use-students"

import {
  ArrowLeft,
  CalendarDays,
  Download,
  ImageIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Upload,
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
import { StudentDialog } from "@/components/forms/student-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { downloadStudentTemplate, parseStudentFile } from "@/lib/services/students-template"
import { importStudentsBulk } from "@/lib/services/students.service"

import type { EventItem, Student } from "@/lib/types"

interface Props {
  id: string
}

export function EventDetail({ id }: Props) {
  /*
   * =========================================================
   * STORE & HOOKS
   * =========================================================
   */
  const store = useStore()
  const { photos } = store

  const {
    universities,
    loading: universitiesLoading,
    error: universitiesError,
    reload: reloadUniversities,
  } = useUniversities()

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    reload: reloadEvents,
    removeEvent,
  } = useEvents()

  const {
    students,
    loading: studentsLoading,
    error: studentsError,
    addStudent,
    editStudent,
    removeStudent,
    reload: reloadStudents,
  } = useStudents(id)

  /*
   * =========================================================
   * DATA DERIVADA
   * =========================================================
   */
  const event = events.find((item) => item.id === id)

  const university = useMemo(() => {
    if (!event) return undefined
    return universities.find((item) => item.id === event.universityId)
  }, [universities, event])

  const eventStudents = students

  const eventPhotos = useMemo(() => {
    const studentIds = new Set(eventStudents.map((student) => student.id))
    return photos.filter((photo) => studentIds.has(photo.studentId))
  }, [photos, eventStudents])

  /*
   * =========================================================
   * ESTADO DE UI
   * =========================================================
   */
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null)
  const [importingStudents, setImportingStudents] = useState(false)
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 })
  const studentFileInputRef = useRef<HTMLInputElement>(null)

  /*
   * =========================================================
   * ACCIONES
   * =========================================================
   */
  function openEditEvent() {
    setEventDialogOpen(true)
  }

  function openCreateStudent() {
    setEditingStudent(null)
    setStudentDialogOpen(true)
  }

  function openEditStudent(student: Student) {
    setEditingStudent(student)
    setStudentDialogOpen(true)
  }

  async function handleStudentImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImportingStudents(true)
      setImportProgress({ processed: 0, total: 0 })
      const rows = await parseStudentFile(file)

      if (rows.length === 0) throw new Error('El archivo no contiene estudiantes para importar.')

      const invalidRows = rows.filter((row) => row.errors.length > 0)
      if (invalidRows.length > 0) {
        const first = invalidRows[0]
        throw new Error(`Hay ${invalidRows.length} fila(s) con errores. Fila ${first.row}: ${first.errors.join(', ')}`)
      }

      setImportProgress({ processed: 0, total: rows.length })
      const result = await importStudentsBulk(
        id,
        rows.map((row) => ({
          documentNumber: row.documentNumber,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          password: row.password,
          status: row.status,
        })),
        (processed, total) => setImportProgress({ processed, total }),
      )

      toast.success(`Importación completada: ${result.created} nuevo(s) y ${result.updated} actualizado(s).`)
      await reloadStudents()
    } catch (error) {
      console.error('Error importando estudiantes:', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el archivo de estudiantes.')
    } finally {
      setImportingStudents(false)
      setImportProgress({ processed: 0, total: 0 })
      if (studentFileInputRef.current) studentFileInputRef.current.value = ''
    }
  }

  async function handleDeleteEvent() {
    if (!deletingEvent) return

    try {
      await removeEvent(deletingEvent.id)
      toast.success("Evento eliminado correctamente.")
      setDeletingEvent(null)
      await reloadEvents()
    } catch (error) {
      console.error("Error eliminando evento:", error)
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el evento."
      )
    }
  }

  /*
   * =========================================================
   * CARGA Y ERRORES
   * =========================================================
   */
  if (universitiesLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando evento...
        </p>
      </div>
    )
  }

  if (universitiesError || eventsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm font-medium text-destructive">
          Ocurrió un error al cargar la información.
        </p>
        <p className="text-xs text-muted-foreground">
          {universitiesError || eventsError}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            reloadUniversities()
            reloadEvents()
          }}
        >
          Intentar nuevamente
        </Button>
      </div>
    )
  }

  if (!event) {
    return <NotFoundState label="evento" backHref="/eventos" />
  }

  /*
   * =========================================================
   * RENDER PRINCIPAL
   * =========================================================
   */
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* HEADER */}
      <PageHeader
        title={event.name}
        description={event.description || "Gestión de detalles y estudiantes del evento."}
        action={
          <div className="flex gap-2">
            <Button
  variant="outline"
  nativeButton={false}
  render={<Link href="/eventos" />}
>
  <ArrowLeft className="mr-2 size-4" />
  Volver
</Button>
            <Button variant="outline" onClick={openEditEvent}>
              <Pencil className="mr-2 size-4" />
              Editar
            </Button>

          


            <Button variant="destructive" onClick={() => setDeletingEvent(event)}>
              Eliminar
            </Button>
          </div>
        }
      />

      {/* CONTENIDO PRINCIPAL EN GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        
        {/* COLUMNA IZQUIERDA: Info principal y tabla (Toma 2 columnas) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          {/* TARJETA: INFO DEL EVENTO */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <h2 className="font-serif text-2xl font-semibold">
                    {event.name}
                  </h2>
                  <EventStatus status={event.status} />
                </div>

                {event.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-8 gap-y-4 pt-2">
                  {event.date && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <div className="flex rounded-full bg-muted p-2">
                        <CalendarDays className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Fecha</span>
                        <span className="font-medium">{formatDate(event.date)}</span>
                      </div>
                    </div>
                  )}

                  {university && (
                    <Link
                      href={`/universidades/${university.id}`}
                      className="group flex items-center gap-2 text-sm transition-colors"
                    >
                      <div className="flex rounded-full bg-muted p-2 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <MapPin className="size-4 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Lugar</span>
                        <span className="font-medium group-hover:underline">
                          {university.name}
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TARJETA: ESTUDIANTES */}
          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg">Estudiantes</h2>
                  <p className="text-sm text-muted-foreground">
                    Directorio de estudiantes registrados en el evento.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={downloadStudentTemplate} disabled={importingStudents}>
                    <Download className="mr-2 size-4" />
                    Plantilla
                  </Button>
                  <input
                    ref={studentFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleStudentImport}
                  />
                  <Button
                    variant="outline"
                    onClick={() => studentFileInputRef.current?.click()}
                    disabled={importingStudents}
                  >
                    {importingStudents ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 size-4" />
                    )}
                    {importingStudents
                      ? importProgress.total > 0
                        ? `Importando ${importProgress.processed}/${importProgress.total}`
                        : 'Leyendo archivo...'
                      : 'Importar Excel'}
                  </Button>
                  <Button onClick={openCreateStudent} disabled={importingStudents}>
                    <Plus className="mr-2 size-4" />
                    Agregar estudiante
                  </Button>
                </div>
              </div>

              {studentsLoading ? (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground animate-pulse">
                    Cargando estudiantes...
                  </p>
                </div>
              ) : studentsError ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center">
                  <p className="text-sm text-destructive font-medium">
                    No se pudieron cargar los estudiantes.
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {studentsError}
                  </p>
                  <Button variant="outline" size="sm" onClick={reloadStudents} className="mt-2">
                    Intentar nuevamente
                  </Button>
                </div>
              ) : eventStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center bg-muted/10">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Users className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No hay estudiantes registrados</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Aún no hay nadie en la lista. Haz clic en "Agregar estudiante" para registrar al primero.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Documento</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Nombre</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Correo</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Estado</th>
                          <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
  {eventStudents.map((student) => (
    <tr
      key={student.id}
      className="transition-colors hover:bg-muted/50 group"
    >
      <td className="p-4 align-middle text-muted-foreground">
        {student.documentNumber}
      </td>
      <td className="p-4 align-middle font-medium">
        {student.firstName} {student.lastName}
      </td>
      <td className="p-4 align-middle text-muted-foreground">
        {student.email || (
          <span className="italic opacity-50">Sin correo</span>
        )}
      </td>
      <td className="p-4 align-middle">
        <StudentStatusLabel status={student.status} />
      </td>
      <td className="p-4 align-middle text-right">
        <div className="flex justify-end gap-1">
              <Button
  variant="ghost"
  size="icon"
  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
  nativeButton={false}
  render={<Link href={`/eventos/${id}/estudiantes/${student.id}`} />}
  title="Ver fotos"
>
  <ImageIcon className="size-4 text-muted-foreground" />
</Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            onClick={() => openEditStudent(student)}
            title="Editar estudiante"
          >
            <Pencil className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Sidebar (Universidad y Resumen) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* TARJETA: UNIVERSIDAD ASOCIADA */}
          <Card>
            <CardContent className="flex flex-col gap-4 p-6">
              <h2 className="font-serif text-lg border-b pb-2">Institución</h2>
              {university ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/universidades/${university.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {university.name}
                  </Link>
                  {university.location && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {university.location}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No hay institución asociada.
                </p>
              )}
            </CardContent>
          </Card>

          {/* TARJETA: RESUMEN Y MÉTRICAS */}
          <Card>
            <CardContent className="flex flex-col gap-6 p-6">
              <h2 className="font-serif text-lg border-b pb-2">Resumen</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <Metric icon={Users} value={eventStudents.length} label="Estudiantes" />
                <Metric icon={ImageIcon} value={eventPhotos.length} label="Fotografías" />
              </div>

              <div className="rounded-lg bg-muted/40 p-4 mt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este evento cuenta actualmente con{" "}
                  <strong className="font-medium text-foreground">
                    {eventStudents.length}
                  </strong>{" "}
                  estudiante{eventStudents.length !== 1 && "s"} y{" "}
                  <strong className="font-medium text-foreground">
                    {eventPhotos.length}
                  </strong>{" "}
                  fotografía{eventPhotos.length !== 1 && "s"} en el sistema.
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* DIÁLOGOS (Ocultos) */}
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={event}
        defaultUniversityId={event.universityId}
        onSaved={async () => {
          await reloadEvents()
          setEventDialogOpen(false)
        }}
      />

      <StudentDialog
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        eventId={id}
        student={editingStudent}
        onCreate={addStudent}
        onUpdate={editStudent}
        onSaved={async () => {
          await reloadStudents()
        }}
      />

      <ConfirmDialog
        open={!!deletingEvent}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null)
        }}
        title="Eliminar evento"
        description={`¿Seguro que deseas eliminar "${deletingEvent?.name}"? Se eliminarán todos sus estudiantes y fotografías permanentemente.`}
        onConfirm={handleDeleteEvent}
      />
    </div>
  )
}

/*
 * =========================================================
 * COMPONENTES DE APOYO (UI HELPER COMPONENTS)
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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-serif text-3xl tabular-nums text-foreground">
        {value}
      </span>
    </div>
  )
}

function EventStatus({ status }: { status: EventItem["status"] }) {
  const config: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: "Borrador",
      className: "border-transparent bg-secondary text-secondary-foreground",
    },
    ACTIVE: {
      label: "Activo",
      className: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    ARCHIVED: {
      label: "Archivado",
      className: "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    },
  }

  const current = config[String(status)] ?? {
    label: String(status),
    className: "border-transparent bg-secondary text-secondary-foreground",
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${current.className}`}>
      {current.label}
    </span>
  )
}

function StudentStatusLabel({ status }: { status: Student["status"] }) {
  const config = {
    PENDING: {
      label: "Pendiente",
      className: "bg-secondary text-secondary-foreground",
    },
    SELECTION_IN_PROGRESS: {
      label: "En proceso",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    SELECTION_SENT: {
      label: "Enviado",
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
  }

  const current = config[status] || { label: status, className: "bg-secondary text-secondary-foreground" }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors border-transparent ${current.className}`}>
      {current.label}
    </span>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
  }).format(date)
}