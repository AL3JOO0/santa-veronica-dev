'use client'

import * as React from 'react'

import { getPhotosCountForStudents } from '@/lib/services/photos.service'

/**
 * Cuenta las fotografías de un conjunto de estudiantes
 * (por ejemplo, todos los de un evento).
 */
export function useEventPhotoCount(studentIds: string[]) {
  const [count, setCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  // Clave estable para el efecto: solo recalculamos si
  // el conjunto de IDs realmente cambió.
  const key = studentIds.join(',')

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const result = await getPhotosCountForStudents(studentIds)
        if (!cancelled) {
          setCount(result)
        }
      } catch (error) {
        console.error('Error cargando conteo de fotografías:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { count, loading }
}