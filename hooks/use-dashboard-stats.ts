'use client'

import * as React from 'react'

import { supabase } from '@/lib/supabase'
import { getStudentsCount } from '@/lib/services/students.service'

export function useDashboardStats() {
  const [studentsCount, setStudentsCount] = React.useState(0)
  const [photosCount, setPhotosCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [students, photosResult] = await Promise.all([
        getStudentsCount(),
        supabase
          .from('photos')
          .select('*', { count: 'exact', head: true }),
      ])

      if (photosResult.error) {
        throw new Error(photosResult.error.message)
      }

      setStudentsCount(students)
      setPhotosCount(photosResult.count ?? 0)
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las estadísticas',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  return {
    studentsCount,
    photosCount,
    loading,
    error,
    reload,
  }
}