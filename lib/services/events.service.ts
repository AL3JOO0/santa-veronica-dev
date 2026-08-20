import { supabase } from '@/lib/supabase'
import type { EventItem, Status } from '@/lib/types'

/*
 * =========================================================
 * TIPOS
 * =========================================================
 */

export interface CreateEventInput {
  universityId: string
  name: string
  description: string
  date: string
  password: string
  status: Status
}

export interface UpdateEventInput {
  universityId?: string
  name?: string
  description?: string
  date?: string
  status?: Status
  password?: string
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

function mapStatus(status: string): Status {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'activo'

    case 'DRAFT':
      return 'borrador'

    case 'CLOSED':
      return 'cerrado'

    case 'ARCHIVED':
      return 'archivado'

    default:
      return 'borrador'
  }
}

/*
 * =========================================================
 * STATUS FRONTEND -> DATABASE
 * =========================================================
 */

function dbStatus(status: Status): string {
  switch (status) {
    case 'activo':
      return 'ACTIVE'

    case 'borrador':
      return 'DRAFT'

    case 'cerrado':
      return 'CLOSED'

    case 'archivado':
      return 'ARCHIVED'

    default:
      return 'DRAFT'
  }
}

/*
 * =========================================================
 * MAPEAR EVENTO
 * =========================================================
 */

function mapEvent(row: any): EventItem {
  return {
    id: row.id,
    universityId: row.institution_id,
    name: row.name,
    description: row.description ?? '',
    date: row.event_date ?? '',
    status: mapStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  }
}

/*
 * =========================================================
 * OBTENER TODOS
 * =========================================================
 */

export async function getEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Error obteniendo eventos:',
      error,
    )

    throw new Error(
      'No se pudieron obtener los eventos',
    )
  }

  return (data ?? []).map(mapEvent)
}

/*
 * =========================================================
 * OBTENER POR ID
 * =========================================================
 */

export async function getEvent(
  id: string,
): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(
      'Error obteniendo evento:',
      error,
    )

    if (error.code === 'PGRST116') {
      return null
    }

    throw new Error(
      'No se pudo obtener el evento',
    )
  }

  return mapEvent(data)
}

/*
 * =========================================================
 * CREAR EVENTO
 * =========================================================
 */

export async function createEvent(
  input: CreateEventInput,
): Promise<EventItem> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      institution_id: input.universityId,
      name: input.name,
      description: input.description,
      event_date: input.date,
      password: input.password,
      status: dbStatus(input.status),
    })
    .select()
    .single()

  if (error) {
    console.error(
      'Error creando evento:',
      error,
    )

    throw new Error(
      error.message ||
        'No se pudo crear el evento',
    )
  }

  return mapEvent(data)
}

/*
 * =========================================================
 * EDITAR EVENTO
 * =========================================================
 */

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<EventItem> {
  const payload: Record<string, unknown> = {}

  if (input.universityId !== undefined) {
    payload.institution_id =
      input.universityId
  }

  if (input.name !== undefined) {
    payload.name = input.name
  }

  if (input.description !== undefined) {
    payload.description = input.description
  }

  if (input.date !== undefined) {
    payload.event_date = input.date
  }

  if (input.status !== undefined) {
    payload.status = dbStatus(input.status)
  }

  if (input.password !== undefined) {
    payload.password = input.password
  }

  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(
      'Error actualizando evento:',
      error,
    )

    throw new Error(
      error.message ||
        'No se pudo actualizar el evento',
    )
  }

  return mapEvent(data)
}

/*
 * =========================================================
 * ELIMINAR EVENTO
 * =========================================================
 */

export async function deleteEvent(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      'Error eliminando evento:',
      error,
    )

    throw new Error(
      error.message ||
        'No se pudo eliminar el evento',
    )
  }
}