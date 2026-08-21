'use server'

import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

interface CreateEventActionInput {
  universityId: string
  name: string
  description: string
  date: string
  password: string
  status: string
}

interface UpdateEventActionInput {
  id: string
  universityId: string
  name: string
  description: string
  date: string
  password?: string
  status: string
}

function mapEventStatus(status: string) {
  switch (status.toLowerCase()) {
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
 * CREAR EVENTO
 * =========================================================
 */

export async function createEventAction(
  input: CreateEventActionInput,
) {
  if (!input.name.trim()) {
    throw new Error(
      'El nombre del evento es obligatorio.',
    )
  }

  if (!input.universityId) {
    throw new Error(
      'La universidad es obligatoria.',
    )
  }

  if (!input.date) {
    throw new Error(
      'La fecha del evento es obligatoria.',
    )
  }

  if (!input.password.trim()) {
    throw new Error(
      'La contraseña de cohorte es obligatoria.',
    )
  }

  const passwordHash = await bcrypt.hash(
    input.password.trim(),
    12,
  )

  const status = mapEventStatus(
    input.status,
  )

  const { data, error } = await supabase
    .from('events')
    .insert({
      institution_id:
        input.universityId,

      name:
        input.name.trim(),

      description:
        input.description.trim() || null,

      event_date:
        input.date || null,

      cohort_password_hash:
        passwordHash,

      status,
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

  return data
}

/*
 * =========================================================
 * EDITAR EVENTO
 * =========================================================
 */

export async function updateEventAction(
  input: UpdateEventActionInput,
) {
  if (!input.id) {
    throw new Error(
      'El ID del evento es obligatorio.',
    )
  }

  if (!input.name.trim()) {
    throw new Error(
      'El nombre del evento es obligatorio.',
    )
  }

  if (!input.universityId) {
    throw new Error(
      'La universidad es obligatoria.',
    )
  }

  if (!input.date) {
    throw new Error(
      'La fecha del evento es obligatoria.',
    )
  }

  const payload: Record<
    string,
    unknown
  > = {
    institution_id:
      input.universityId,

    name:
      input.name.trim(),

    description:
      input.description.trim() || null,

    event_date:
      input.date || null,

    status:
      mapEventStatus(input.status),

    updated_at:
      new Date().toISOString(),
  }

  /*
   * Si el usuario escribió una nueva contraseña,
   * generamos un nuevo hash.
   *
   * Si viene vacía, conservamos la actual.
   */

  if (input.password?.trim()) {
    payload.cohort_password_hash =
      await bcrypt.hash(
        input.password.trim(),
        12,
      )
  }

  const {
    data,
    error,
  } = await supabase
    .from('events')
    .update(payload)
    .eq('id', input.id)
    .select()
    .single()

  if (error) {
    console.error(
      'Error actualizando evento:',
      error,
    )

    throw new Error(error.message)
  }

  return data
}

/*
 * =========================================================
 * ELIMINAR EVENTO
 * =========================================================
 */

export async function deleteEventAction(
  id: string,
) {
  if (!id) {
    throw new Error(
      'El ID del evento es obligatorio.',
    )
  }

  const {
    error,
  } = await supabase
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

  return {
    success: true,
  }
}