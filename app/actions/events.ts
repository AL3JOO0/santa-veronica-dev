'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import type { EventItem, Status } from '@/lib/types'
import {
  createEventSchema,
  firstZodError,
  idSchema,
  updateEventSchema,
} from '@/lib/validation'

const EVENT_COLUMNS =
  'id, institution_id, name, description, event_date, status, created_at, updated_at'

function toDatabaseStatus(status: Status) {
  return {
    activo: 'ACTIVE',
    borrador: 'DRAFT',
    cerrado: 'CLOSED',
    archivado: 'ARCHIVED',
  }[status]
}

function fromDatabaseStatus(status: string): Status {
  return ({
    ACTIVE: 'activo',
    DRAFT: 'borrador',
    CLOSED: 'cerrado',
    ARCHIVED: 'archivado',
  } as const)[status.toUpperCase()] || 'borrador'
}

function mapEvent(row: Record<string, unknown>): EventItem {
  return {
    id: String(row.id),
    universityId: String(row.institution_id),
    name: String(row.name),
    description: typeof row.description === 'string' ? row.description : '',
    date: typeof row.event_date === 'string' ? row.event_date : '',
    status: fromDatabaseStatus(String(row.status)),
    createdAt: String(row.created_at),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  }
}

export async function createEventAction(input: unknown): Promise<EventItem> {
  await requireAdminSession()
  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstZodError(parsed.error))

  const value = parsed.data
  const passwordHash = await bcrypt.hash(value.password, 12)
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('events')
    .insert({
      institution_id: value.universityId,
      name: value.name,
      description: value.description || null,
      event_date: value.date,
      cohort_password_hash: passwordHash,
      status: toDatabaseStatus(value.status),
    })
    .select(EVENT_COLUMNS)
    .single()

  if (error) {
    console.error('Error creando evento:', error)
    throw new Error('No se pudo crear el evento.')
  }

  revalidatePath('/')
  revalidatePath('/eventos')
  return mapEvent(data)
}

export async function updateEventAction(input: unknown): Promise<EventItem> {
  await requireAdminSession()
  const parsed = updateEventSchema.safeParse(input)
  if (!parsed.success) throw new Error(firstZodError(parsed.error))

  const value = parsed.data
  const payload: Record<string, unknown> = {
    institution_id: value.universityId,
    name: value.name,
    description: value.description || null,
    event_date: value.date,
    status: toDatabaseStatus(value.status),
    updated_at: new Date().toISOString(),
  }

  if (value.password) {
    payload.cohort_password_hash = await bcrypt.hash(value.password, 12)
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('events')
    .update(payload)
    .eq('id', value.id)
    .select(EVENT_COLUMNS)
    .single()

  if (error) {
    console.error('Error actualizando evento:', error)
    throw new Error('No se pudo actualizar el evento.')
  }

  revalidatePath('/')
  revalidatePath('/eventos')
  revalidatePath(`/eventos/${value.id}`)
  return mapEvent(data)
}

export async function deleteEventAction(id: unknown) {
  await requireAdminSession()
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstZodError(parsedId.error))

  const admin = createSupabaseAdminClient()
  const { error } = await admin.from('events').delete().eq('id', parsedId.data)
  if (error) {
    console.error('Error eliminando evento:', error)
    throw new Error('No se pudo eliminar el evento.')
  }

  revalidatePath('/')
  revalidatePath('/eventos')
  return { success: true }
}
