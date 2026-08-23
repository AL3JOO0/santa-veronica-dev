"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { useStudents } from "@/hooks/use-students"
import { usePhotos } from "@/hooks/use-photos"

import { PageHeader } from "@/components/shared/page-header"
import { NotFoundState } from "@/components/shared/not-found-state"
import { PhotoDropzone } from "@/components/photos/photo-dropzone"
import { PhotoGrid } from "@/components/photos/photo-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface UploadTask {
  id: string
  filename: string
  progress: number
}

interface Props {
  eventId: string
  studentId: string
}

export function StudentPhotos({ eventId, studentId }: Props) {
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
  } = useStudents(eventId)

  const student = students.find((s) => s.id === studentId)

  const {
    photos,
    loading: photosLoading,
    error: photosError,
    reload,
    uploadPhoto,
    removePhoto,
  } = usePhotos(studentId)

  const [tasks, setTasks] = React.useState<UploadTask[]>([])

  async function handleFiles(files: File[]) {
    const newTasks: UploadTask[] = files.map((f) => ({
      id: crypto.randomUUID(),
      filename: f.name,
      progress: 0,
    }))
    setTasks((prev) => [...prev, ...newTasks])

    await Promise.all(
      files.map(async (file, i) => {
        const taskId = newTasks[i].id
        try {
          await uploadPhoto(file, (percent) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, progress: percent } : t
              )
            )
          })
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : `No se pudo subir ${file.name}.`
          )
        } finally {
          setTasks((prev) => prev.filter((t) => t.id !== taskId))
        }
      })
    )

    await reload()
    toast.success("Fotos subidas correctamente.")
  }

  async function handleDelete(id: string) {
    try {
      await removePhoto(id)
      toast.success("Foto eliminada.")
      await reload()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo eliminar la foto."
      )
    }
  }

  if (studentsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando estudiante...
        </p>
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm font-medium text-destructive">
          Ocurrió un error al cargar el estudiante.
        </p>
        <p className="text-xs text-muted-foreground">{studentsError}</p>
      </div>
    )
  }

  if (!student) {
    return <NotFoundState label="estudiante" backHref={`/eventos/${eventId}`} />
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title={`Fotos de ${student.firstName} ${student.lastName}`}
        description="Sube y administra las fotografías del estudiante."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/eventos/${eventId}`} />}
          >
            <ArrowLeft className="mr-2 size-4" />
            Volver al evento
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <PhotoDropzone onFiles={handleFiles} disabled={tasks.length > 0} />

          {tasks.length > 0 && (
            <div className="flex flex-col gap-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate text-muted-foreground">
                    {t.filename}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {t.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {photosLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground animate-pulse">
              Cargando fotos...
            </p>
          ) : photosError ? (
            <p className="py-10 text-center text-sm text-destructive">
              {photosError}
            </p>
          ) : (
            <PhotoGrid photos={photos} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}