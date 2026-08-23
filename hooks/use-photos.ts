"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
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
  }
}

export function photoUrl(storageKey: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${storageKey}`
}

export function usePhotos(studentId: string) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: dbError } = await supabase
        .from("photos")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })

      if (dbError) throw new Error(dbError.message)

      setPhotos((data ?? []).map(mapRow))
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

    // 2. subir directo a R2
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
        else reject(new Error("Falló la subida a R2."))
      }
      xhr.onerror = () => reject(new Error("Falló la subida a R2."))
      xhr.send(file)
    })

    // 3. registrar en Supabase directo desde el cliente
    const { error: insertError } = await supabase.from("photos").insert({
      student_id: studentId,
      storage_key: key,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
    })

    if (insertError) throw new Error(insertError.message)
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