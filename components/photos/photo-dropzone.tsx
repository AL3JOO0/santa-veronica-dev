"use client"

import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILES_PER_UPLOAD,
  MAX_IMAGE_BYTES,
} from "@/lib/upload-constraints"

interface PhotoDropzoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function PhotoDropzone({ onFiles, disabled }: PhotoDropzoneProps) {
  const [dragging, setDragging] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return

    const selectedFiles = Array.from(fileList)
    const validFiles = selectedFiles.filter(
      (file) =>
        ALLOWED_IMAGE_TYPES.includes(
          file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
        ) && file.size > 0 && file.size <= MAX_IMAGE_BYTES,
    )
    const files = validFiles.slice(0, MAX_FILES_PER_UPLOAD)
    const invalidCount = selectedFiles.length - validFiles.length
    const omittedCount = Math.max(validFiles.length - MAX_FILES_PER_UPLOAD, 0)

    if (invalidCount > 0 || omittedCount > 0) {
      const details = [
        invalidCount > 0
          ? `${invalidCount} archivo${invalidCount === 1 ? '' : 's'} no compatible${invalidCount === 1 ? '' : 's'}`
          : null,
        omittedCount > 0
          ? `${omittedCount} archivo${omittedCount === 1 ? '' : 's'} fuera del máximo por lote`
          : null,
      ].filter(Boolean)
      setNotice(details.join(' · '))
    } else {
      setNotice(null)
    }

    if (files.length > 0) onFiles(files)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <UploadCloud className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">
        Arrastra fotos aquí o haz clic para seleccionar
      </p>
      <p className="text-xs text-muted-foreground">
        JPG, PNG o WEBP — hasta {MAX_FILES_PER_UPLOAD.toLocaleString('es-CO')} archivos de 15 MB
      </p>
      {notice ? <p className="text-xs text-amber-700">{notice}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}
