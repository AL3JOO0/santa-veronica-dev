'use client'

import * as React from 'react'

import {
  getStudentsByEvent,
  createStudent,
  createStudentsBulk,
  updateStudent,
  deleteStudent,
} from '@/lib/services/students.service'

import type { Student } from '@/lib/types'

import type {
  CreateStudentInput,
  UpdateStudentInput,
  BulkCreateStudentInput,
} from '@/lib/services/students.service'

export function useStudents(
  eventId?: string,
) {
  const [students, setStudents] =
    React.useState<Student[]>([])

  const [loading, setLoading] =
    React.useState(true)

  const [error, setError] =
    React.useState<string | null>(null)

  /**
   * Cargar estudiantes del evento.
   */
  const loadStudents =
    React.useCallback(async () => {
      if (!eventId) {
        setStudents([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data =
          await getStudentsByEvent(eventId)

        setStudents(data)
      } catch (error) {
        console.error(error)

        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los estudiantes',
        )
      } finally {
        setLoading(false)
      }
    }, [eventId])

  /**
   * Cargar inicialmente y cuando cambie el evento.
   */
  React.useEffect(() => {
    loadStudents()
  }, [loadStudents])

  /**
   * Crear estudiante.
   */
  const addStudent =
    React.useCallback(
      async (
        student: CreateStudentInput,
      ) => {
        const created =
          await createStudent(student)

        setStudents((prev) => [
          created,
          ...prev,
        ])

        return created
      },
      [],
    )
  const bulkAddStudents =
    React.useCallback(
      async (students: BulkCreateStudentInput[]) => {
        const result = await createStudentsBulk(students)
        await loadStudents()
        return result
      },
      [loadStudents],
    )
  /**
   * Actualizar estudiante.
   */
  const editStudent =
    React.useCallback(
      async (
        id: string,
        student: UpdateStudentInput,
      ) => {
        const updated =
          await updateStudent(
            id,
            student,
          )

        setStudents((prev) =>
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
   * Eliminar estudiante.
   */
  const removeStudent =
    React.useCallback(
      async (id: string) => {
        await deleteStudent(id)

        setStudents((prev) =>
          prev.filter(
            (item) => item.id !== id,
          ),
        )
      },
      [],
    )

  return {
    students,
    loading,
    error,

    addStudent,
    bulkAddStudents,
    editStudent,
    removeStudent,

    reload: loadStudents,
  }
}