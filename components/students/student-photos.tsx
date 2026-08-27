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
import { MAX_PARALLEL_UPLOADS } from "@/lib/upload-constraints"

interface UploadTask {
  id: string
  filename: string
  progress: number
}

interface UploadSummary {
  total: number
  completed: number
  failed: number
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
    loadingMore,
    hasMore,
    error: photosError,
    reload,
    loadMore,
    uploadPhoto,
    removePhoto,
  } = usePhotos(studentId)

  const [activeTasks, setActiveTasks] = React.useState<UploadTask[]>([])
  const [uploadSummary, setUploadSummary] = React.useState<UploadSummary | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  async function handleFiles(files: File[]) {
    if (isUploading || files.length === 0) return

    setIsUploading(true)
    setActiveTasks([])
    setUploadSummary({ total: files.length, completed: 0, failed: 0 })

    let nextIndex = 0
    let uploadedCount = 0
    let failedCount = 0
    const failedFilenames: string[] = []

    const worker = async () => {
      while (nextIndex < files.length) {
        const i = nextIndex++
        const file = files[i]
        const taskId = crypto.randomUUID()

        setActiveTasks((current) => [
          ...current,
          { id: taskId, filename: file.name, progress: 0 },
        ])

        try {
          await uploadPhoto(file, (percent) => {
            setActiveTasks((current) =>
              current.map((t) =>
                t.id === taskId ? { ...t, progress: percent } : t
              )
            )
          })
          uploadedCount += 1
          setUploadSummary((current) =>
            current ? { ...current, completed: current.completed + 1 } : current,
          )
        } catch {
          failedCount += 1
          if (failedFilenames.length < 3) failedFilenames.push(file.name)
          setUploadSummary((current) =>
            current ? { ...current, failed: current.failed + 1 } : current,
          )
        } finally {
          setActiveTasks((current) => current.filter((t) => t.id !== taskId))
        }
      }
    }

    try {
      await Promise.all(
        Array.from(
          { length: Math.min(MAX_PARALLEL_UPLOADS, files.length) },
          () => worker(),
        ),
      )

      if (uploadedCount > 0) {
        await reload()
        toast.success(`${uploadedCount} foto${uploadedCount === 1 ? '' : 's'} subida${uploadedCount === 1 ? '' : 's'} correctamente.`)
      }

      if (failedCount > 0) {
        const examples = failedFilenames.length > 0
          ? ` Revisa: ${failedFilenames.join(', ')}${failedCount > failedFilenames.length ? '…' : ''}`
          : ''
        toast.error(`${failedCount} foto${failedCount === 1 ? '' : 's'} no se pudieron subir.${examples}`)
      }
    } finally {
      setIsUploading(false)
      setActiveTasks([])
    }
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
          <PhotoDropzone onFiles={handleFiles} disabled={isUploading} />

          {uploadSummary ? (
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {isUploading ? 'Subiendo fotografías…' : 'Carga finalizada'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {uploadSummary.completed + uploadSummary.failed} de {uploadSummary.total} procesadas
                  {uploadSummary.failed > 0 ? ` · ${uploadSummary.failed} con error` : ''}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.round(
                      ((uploadSummary.completed +
                        uploadSummary.failed +
                        activeTasks.reduce((total, task) => total + task.progress / 100, 0)) /
                        uploadSummary.total) *
                        100,
                    )}%`,
                  }}
                />
              </div>

              {activeTasks.map((t) => (
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
          ) : null}
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
            <div className="space-y-5">
              <PhotoGrid photos={photos} onDelete={handleDelete} />
              {hasMore && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Cargando..." : "Cargar más fotos"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
