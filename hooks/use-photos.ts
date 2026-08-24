"use client"

import { useCallback, useEffect, useState } from "react"
import type { Photo } from "@/lib/types"

function mapRow(row: any): Photo {
  return {
    id: row.id,
    studentId: row.student_id,
    storageKey: row.storage_key,
    thumbnailKey: row.thumbnail_key,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
    displayUrl: row.display_url,
  }
}

export function photoUrl(photo: Photo) {
  if (photo.displayUrl) return photo.displayUrl
  if (/^https?:\/\//i.test(photo.storageKey)) return photo.storageKey

  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, '') || ''
  const cleanKey = photo.storageKey.replace(/^\/+/, '')
  return baseUrl ? `${baseUrl}/${cleanKey}` : '/placeholder.jpg'
}

export function usePhotos(studentId: string) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/photos/list?studentId=${encodeURIComponent(studentId)}`,
        { cache: 'no-store' },
      )

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; data?: any[]; message?: string }
        | null

      if (!response.ok || !body?.ok) {
        throw new Error(body?.message || 'No fue posible cargar las fotografías.')
      }

      setPhotos((body.data ?? []).map(mapRow))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.")
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    reload()
  }, [reload])

  async function uploadPhoto(
    file: File,
    onProgress?: (percent: number) => void
  ) {
    // 1. pedir URL firmada de subida
    const signRes = await fetch("/api/photos/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        filename: file.name,
        mimeType: file.type,
      }),
    })
    if (!signRes.ok) throw new Error("No se pudo iniciar la subida.")
    const { uploadUrl, key } = await signRes.json()

    // 2. subir directo al almacenamiento S3 compatible (MinIO o Cloudflare R2)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", uploadUrl)
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error("Falló la subida al almacenamiento."))
      }
      xhr.onerror = () => reject(new Error("Falló la subida al almacenamiento."))
      xhr.send(file)
    })

    // 3. registrar en Supabase desde el backend para no depender de RLS del navegador
    const registerRes = await fetch("/api/photos/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        key,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    })

    if (!registerRes.ok) {
      const body = await registerRes.json().catch(() => null)
      throw new Error(body?.message ?? "La foto se subió, pero no pudo registrarse.")
    }
  }

  async function removePhoto(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error ?? "No se pudo eliminar la foto.")
    }
  }

  return { photos, loading, error, reload, uploadPhoto, removePhoto }
}
