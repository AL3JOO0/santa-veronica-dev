"use client"

import * as React from "react"
import Image from "next/image"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { photoUrl } from "@/hooks/use-photos"
import type { Photo } from "@/lib/types"

interface PhotoGridProps {
  photos: Photo[]
  onDelete: (id: string) => Promise<void>
}

export function PhotoGrid({ photos, onDelete }: PhotoGridProps) {
  const [deleting, setDeleting] = React.useState<Photo | null>(null)

  async function handleConfirm() {
    if (!deleting) return
    await onDelete(deleting.id)
    setDeleting(null)
  }

  if (photos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aún no hay fotos para este estudiante.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <Image
              src={photoUrl(photo)}
              alt={photo.originalFilename}
              fill
              sizes="200px"
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-end bg-black/0 p-2 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => setDeleting(photo)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar foto"
        description={`¿Seguro que deseas eliminar "${deleting?.originalFilename}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirm}
      />
    </>
  )
}
