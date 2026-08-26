'use client'

import * as React from 'react'

import { getDashboardStats } from '@/lib/services/stats.service'

export function useDashboardStats() {
  const [studentsCount, setStudentsCount] = React.useState(0)
  const [photosCount, setPhotosCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const stats = await getDashboardStats(true)
      setStudentsCount(stats.studentsCount)
      setPhotosCount(stats.photosCount)
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
