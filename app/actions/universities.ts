'use server'

import { revalidatePath } from 'next/cache'

import { requireAdminSession } from '@/lib/server/auth-guards'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import type { University } from '@/lib/types'
import {
  firstZodError,
  idSchema,
  universitySchema,
  updateUniversitySchema,
} from '@/lib/validation'

const UNIVERSITY_COLUMNS =
  'id, name, short_name, description, location, active, notification_email, created_at, updated_at'

export async function createUniversityAction(input: unknown): Promise<University> {
  await requireAdminSession()
  const parsed = universitySchema.safeParse(input)
  if (!parsed.success) throw new Error(firstZodError(parsed.error))

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('institutions')
    .insert(parsed.data)
    .select(UNIVERSITY_COLUMNS)
    .single()

  if (error) {
    console.error('Error creando institución:', error)
    throw new Error('No se pudo crear la universidad.')
  }

  revalidatePath('/universidades')
  return data
}

export async function updateUniversityAction(
  id: unknown,
  input: unknown,
): Promise<University> {
  await requireAdminSession()
  const parsedId = idSchema.safeParse(id)
  const parsed = updateUniversitySchema.safeParse(input)
  if (!parsedId.success) throw new Error(firstZodError(parsedId.error))
  if (!parsed.success) throw new Error(firstZodError(parsed.error))

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('institutions')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', parsedId.data)
    .select(UNIVERSITY_COLUMNS)
    .single()

  if (error) {
    console.error('Error actualizando institución:', error)
    throw new Error('No se pudo actualizar la universidad.')
  }

  revalidatePath('/universidades')
  revalidatePath(`/universidades/${parsedId.data}`)
  return data
}

export async function deleteUniversityAction(id: unknown) {
  await requireAdminSession()
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) throw new Error(firstZodError(parsedId.error))

  const admin = createSupabaseAdminClient()
  const { error } = await admin.from('institutions').delete().eq('id', parsedId.data)
  if (error) {
    console.error('Error eliminando institución:', error)
    throw new Error('No se pudo eliminar la universidad.')
  }

  revalidatePath('/universidades')
  return { success: true }
}
