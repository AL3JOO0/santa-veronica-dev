'use client'

import * as React from 'react'
import {
  getUniversities,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} from '@/lib/services/universities.service'

import type {
  University,
} from '@/lib/types'

import type {
  CreateUniversityInput,
  UpdateUniversityInput,
} from '@/lib/services/universities.service'

export function useUniversities() {
  const [universities, setUniversities] =
    React.useState<University[]>([])

  const [loading, setLoading] =
    React.useState(true)

  const [error, setError] =
    React.useState<string | null>(null)

  /**
   * Cargar universidades.
   */
  const loadUniversities = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await getUniversities()

      setUniversities(data)
    } catch (error) {
      console.error(error)

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las universidades',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Cargar inicialmente.
   */
  React.useEffect(() => {
    loadUniversities()
  }, [loadUniversities])

  /**
   * Crear universidad.
   */
  const addUniversity = React.useCallback(
    async (
      university: CreateUniversityInput,
    ) => {
      const created =
        await createUniversity(university)

      setUniversities((prev) => [
        created,
        ...prev,
      ])

      return created
    },
    [],
  )

  /**
   * Actualizar universidad.
   */
  const editUniversity = React.useCallback(
    async (
      id: string,
      university: UpdateUniversityInput,
    ) => {
      const updated =
        await updateUniversity(
          id,
          university,
        )

      setUniversities((prev) =>
        prev.map((item) =>
          item.id === id
            ? updated
            : item,
        ),
      )

      return updated
    },
    [],
  )

  /**
   * Eliminar universidad.
   */
  const removeUniversity = React.useCallback(
    async (id: string) => {
      await deleteUniversity(id)

      setUniversities((prev) =>
        prev.filter(
          (item) => item.id !== id,
        ),
      )
    },
    [],
  )

  return {
    universities,
    loading,
    error,

    addUniversity,
    editUniversity,
    removeUniversity,

    reload: loadUniversities,
  }
}