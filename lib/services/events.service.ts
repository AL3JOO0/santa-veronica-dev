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
  status: Status
}

export interface UpdateEventInput {
  universityId?: string
  name?: string
  description?: string
  date?: string
  status?: Status
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Convierte el status de Supabase
 * al formato utilizado por React.
 */
function mapStatus(status: string): Status {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'activo'

    case 'ARCHIVED':
      return 'archivado'

    case 'DRAFT':
      return 'borrador'

    default:
      return 'borrador'
  }
}

/**
 * Convierte un registro de Supabase
 * al modelo utilizado por el frontend.
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
 * OBTENER EVENTOS
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
 * OBTENER EVENTO
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
  event: CreateEventInput,
): Promise<EventItem> {
  /*
   * IMPORTANTE:
   *
   * La BD actualmente exige:
   *
   * cohort_password_hash NOT NULL
   *
   * Por eso todavía NO hacemos el insert definitivo
   * hasta resolver el manejo de la contraseña.
   */

  const { data, error } = await supabase
    .from('events')
    .insert({
      institution_id: event.universityId,
      name: event.name,
      description: event.description,
      event_date: event.date || null,

      /*
       * Pendiente:
       * cohort_password_hash
       */

      status: event.status.toUpperCase(),
    })
    .select()
    .single()

  if (error) {
    console.error(
      'Error creando evento:',
      error,
    )

    throw new Error(error.message)
  }

  return mapEvent(data)
}

/*
 * =========================================================
 * ACTUALIZAR EVENTO
 * =========================================================
 */

export async function updateEvent(
  id: string,
  event: UpdateEventInput,
): Promise<EventItem> {
  const payload: Record<string, unknown> = {}

  if (event.universityId !== undefined) {
    payload.institution_id =
      event.universityId
  }

  if (event.name !== undefined) {
    payload.name = event.name
  }

  if (event.description !== undefined) {
    payload.description =
      event.description
  }

  if (event.date !== undefined) {
    payload.event_date =
      event.date || null
  }

  if (event.status !== undefined) {
    payload.status =
      event.status.toUpperCase()
  }

  payload.updated_at =
    new Date().toISOString()

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

    throw new Error(error.message)
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

    throw new Error(error.message)
  }
}