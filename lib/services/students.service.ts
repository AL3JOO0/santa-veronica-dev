import { supabase } from '@/lib/supabase'
import type { Student } from '@/lib/types'

export type CreateStudentInput = Omit<
  Student,
  'id' | 'createdAt' | 'updatedAt' | 'authUserId'
>

export type UpdateStudentInput = Partial<
  Omit<
    Student,
    'id' | 'createdAt' | 'updatedAt' | 'authUserId'
  >
>

function mapStudent(row: any): Student {
  return {
    id: row.id,
    eventId: row.event_id,
    documentNumber: row.document_number,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authUserId: row.auth_user_id,
  }
}

/**
 * Obtener todos los estudiantes.
 */
export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(
      'Error obteniendo estudiantes:',
      error,
    )

    throw new Error(
      'No se pudieron obtener los estudiantes',
    )
  }

  return (data ?? []).map(mapStudent)
}

/**
 * Obtener estudiantes de un evento.
 */
export async function getStudentsByEvent(
  eventId: string,
): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Error obteniendo estudiantes del evento:',
      error,
    )

    throw new Error(
      'No se pudieron obtener los estudiantes del evento',
    )
  }

  return (data ?? []).map(mapStudent)
}

/**
 * Obtener un estudiante por ID.
 */
export async function getStudent(
  id: string,
): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(
      'Error obteniendo estudiante:',
      error,
    )

    if (error.code === 'PGRST116') {
      return null
    }

    throw new Error(
      'No se pudo obtener el estudiante',
    )
  }

  return mapStudent(data)
}

/**
 * Crear estudiante.
 */
export async function createStudent(
  student: CreateStudentInput,
): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert({
      event_id: student.eventId,
      document_number: student.documentNumber,
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email || null,
      status: student.status,
    })
    .select()
    .single()

  if (error) {
    console.error(
      'Error creando estudiante:',
      error,
    )

    throw new Error(error.message)
  }

  return mapStudent(data)
}

/**
 * Actualizar estudiante.
 */
export async function updateStudent(
  id: string,
  student: UpdateStudentInput,
): Promise<Student> {
  const payload: Record<string, unknown> = {}

  if (student.eventId !== undefined) {
    payload.event_id = student.eventId
  }

  if (student.documentNumber !== undefined) {
    payload.document_number =
      student.documentNumber
  }

  if (student.firstName !== undefined) {
    payload.first_name = student.firstName
  }

  if (student.lastName !== undefined) {
    payload.last_name = student.lastName
  }

  if (student.email !== undefined) {
    payload.email = student.email || null
  }

  if (student.status !== undefined) {
    payload.status = student.status
  }

  payload.updated_at =
    new Date().toISOString()

  const { data, error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(
      'Error actualizando estudiante:',
      error,
    )

    throw new Error(error.message)
  }

  return mapStudent(data)
}

/**
 * Eliminar estudiante.
 */
export async function deleteStudent(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      'Error eliminando estudiante:',
      error,
    )

    throw new Error(error.message)
  }
}