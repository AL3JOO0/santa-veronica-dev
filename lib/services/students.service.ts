import type { Student, StudentStatus } from '@/lib/types'

export interface CreateStudentInput {
  eventId: string
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  password: string
  status: StudentStatus
}

export interface UpdateStudentInput {
  eventId?: string
  documentNumber?: string
  firstName?: string
  lastName?: string
  email?: string | null
  password?: string
  status?: StudentStatus
}

export interface BulkStudentInput {
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  password: string
  status: StudentStatus
}

export interface BulkCreateStudentInput extends BulkStudentInput {
  eventId: string
}

interface ApiResponse<T> {
  ok: boolean
  data?: T
  message?: string
  created?: number
  updated?: number
}

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

  }
}

async function readApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  const data = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null

  return (
    data ?? {
      ok: false,
      message:
        'No fue posible procesar la respuesta del servidor.',
    }
  )
}

/**
 * Obtener todos los estudiantes.
 */
export async function getStudents(): Promise<Student[]> {
  const response = await fetch('/api/students', {
    cache: 'no-store',
  })

  const result =
    await readApiResponse<any[]>(response)

  if (!response.ok || !result.ok) {
    throw new Error(
      result.message ||
        'No se pudieron obtener los estudiantes.',
    )
  }

  return (result.data ?? []).map(mapStudent)
}

/**
 * Contar estudiantes.
 *
 * Se conserva la función que existía en developer,
 * pero usando nuestra API en lugar de consultar
 * Supabase directamente desde el navegador.
 */
export async function getStudentsCount(): Promise<number> {
  const students = await getStudents()
  return students.length
}

/**
 * Obtener relación estudiante-evento.
 *
 * Se conserva la funcionalidad que existía
 * en developer sin volver a consultar Supabase
 * directamente desde cliente.
 */
export async function getStudentEventMap(): Promise<
  { id: string; eventId: string }[]
> {
  const students = await getStudents()

  return students.map((student) => ({
    id: student.id,
    eventId: student.eventId,
  }))
}

/**
 * Obtener estudiantes de un evento.
 */
export async function getStudentsByEvent(
  eventId: string,
): Promise<Student[]> {
  const response = await fetch(
    `/api/students?eventId=${encodeURIComponent(eventId)}`,
    {
      cache: 'no-store',
    },
  )

  const result =
    await readApiResponse<any[]>(response)

  if (!response.ok || !result.ok) {
    throw new Error(
      result.message ||
        'No se pudieron obtener los estudiantes del evento.',
    )
  }

  return (result.data ?? []).map(mapStudent)
}

/**
 * Obtener estudiante por ID.
 */
export async function getStudent(
  id: string,
): Promise<Student | null> {
  const response = await fetch(
    `/api/students/${encodeURIComponent(id)}`,
    {
      cache: 'no-store',
    },
  )

  if (response.status === 404) {
    return null
  }

  const result =
    await readApiResponse<any>(response)

  if (
    !response.ok ||
    !result.ok ||
    !result.data
  ) {
    throw new Error(
      result.message ||
        'No se pudo obtener el estudiante.',
    )
  }

  return mapStudent(result.data)
}

/**
 * Crear estudiante.
 *
 * La contraseña viaja al backend.
 * El backend genera password_hash con bcrypt.
 */
export async function createStudent(
  student: CreateStudentInput,
): Promise<Student> {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(student),
  })

  const result =
    await readApiResponse<any>(response)

  if (
    !response.ok ||
    !result.ok ||
    !result.data
  ) {
    throw new Error(
      result.message ||
        'No se pudo crear el estudiante.',
    )
  }

  return mapStudent(result.data)
}

/**
 * Actualizar estudiante.
 *
 * Si password viene vacío/no definido,
 * el backend conserva la contraseña existente.
 */
export async function updateStudent(
  id: string,
  student: UpdateStudentInput,
): Promise<Student> {
  const response = await fetch(
    `/api/students/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(student),
    },
  )

  const result =
    await readApiResponse<any>(response)

  if (
    !response.ok ||
    !result.ok ||
    !result.data
  ) {
    throw new Error(
      result.message ||
        'No se pudo actualizar el estudiante.',
    )
  }

  return mapStudent(result.data)
}

/**
 * Eliminar estudiante.
 */
export async function deleteStudent(
  id: string,
): Promise<void> {
  const response = await fetch(
    `/api/students/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  )

  const result =
    await readApiResponse<never>(response)

  if (!response.ok || !result.ok) {
    throw new Error(
      result.message ||
        'No se pudo eliminar el estudiante.',
    )
  }
}

/**
 * Importación masiva.
 *
 * Se procesan lotes de 40 para evitar
 * peticiones demasiado grandes.
 */
export async function importStudentsBulk(
  eventId: string,
  students: BulkStudentInput[],
  onProgress?: (
    processed: number,
    total: number,
  ) => void,
) {
  const BATCH_SIZE = 40

  let created = 0
  let updated = 0
  let processed = 0

  for (
    let index = 0;
    index < students.length;
    index += BATCH_SIZE
  ) {
    const batch = students.slice(
      index,
      index + BATCH_SIZE,
    )

    const response = await fetch(
      '/api/students/bulk',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          students: batch,
        }),
      },
    )

    const result =
      await readApiResponse<never>(response)

    if (!response.ok || !result.ok) {
      throw new Error(
        result.message ||
          'No se pudo importar el archivo.',
      )
    }

    created += result.created ?? 0
    updated += result.updated ?? 0

    processed += batch.length

    onProgress?.(
      processed,
      students.length,
    )
  }

  return {
    created,
    updated,
    total: students.length,
  }
}

/**
 * Compatibilidad con la función anterior
 * createStudentsBulk.
 */
export async function createStudentsBulk(
  students: BulkCreateStudentInput[],
) {
  if (students.length === 0) {
    return {
      created: 0,
      updated: 0,
      total: 0,
    }
  }

  const eventIds = Array.from(
    new Set(
      students.map(
        (student) => student.eventId,
      ),
    ),
  )

  if (eventIds.length !== 1) {
    throw new Error(
      'La carga masiva debe pertenecer a un solo evento.',
    )
  }

  return importStudentsBulk(
    eventIds[0],
    students.map(
      ({
        eventId: _eventId,
        ...student
      }) => student,
    ),
  )
}