import { supabase } from '@/lib/supabase'
import type { University } from '@/lib/types'

export type CreateUniversityInput = Omit<
  University,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateUniversityInput = Partial<
  Omit<University, 'id' | 'created_at' | 'updated_at'>
>

/**
 * Obtener todas las universidades.
 */
export async function getUniversities(): Promise<University[]> {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo instituciones:', error)
    throw new Error('No se pudieron obtener las universidades')
  }

  return data ?? []
}

/**
 * Obtener una universidad por ID.
 */
export async function getUniversity(
  id: string,
): Promise<University | null> {
  const { data, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error obteniendo institución:', error)

    if (error.code === 'PGRST116') {
      return null
    }

    throw new Error('No se pudo obtener la universidad')
  }

  return data
}

/**
 * Crear una universidad.
 */
export async function createUniversity(
  university: CreateUniversityInput,
): Promise<University> {
  const { data, error } = await supabase
    .from('institutions')
    .insert({
      name: university.name,
      short_name: university.short_name,
      description: university.description,
      location: university.location,
      active: university.active,
      notification_email: university.notification_email || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando institución:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Actualizar una universidad.
 */
export async function updateUniversity(
  id: string,
  university: UpdateUniversityInput,
): Promise<University> {
  const { data, error } = await supabase
    .from('institutions')
    .update({
      ...university,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error actualizando institución:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * Eliminar una universidad.
 */
export async function deleteUniversity(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('institutions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando institución:', error)
    throw new Error(error.message)
  }
}