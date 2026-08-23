import { supabase } from '@/lib/supabase'

/**
 * Contar el total de fotografías en el sistema.
 */
export async function getPhotosCount(): Promise<number> {
  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error contando fotografías:', error)
    throw new Error('No se pudo contar las fotografías')
  }

  return count ?? 0
}

/**
 * Contar las fotografías que pertenecen a un conjunto
 * específico de estudiantes (por ejemplo, todos los
 * estudiantes de un evento).
 */
export async function getPhotosCountForStudents(
  studentIds: string[],
): Promise<number> {
  if (studentIds.length === 0) {
    return 0
  }

  const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true })
    .in('student_id', studentIds)

  if (error) {
    console.error('Error contando fotografías del evento:', error)
    throw new Error('No se pudieron contar las fotografías del evento')
  }

  return count ?? 0
}

/**
 * Traer solamente el student_id de cada fotografía.
 * Útil para agregar conteos por evento en el cliente
 * sin traer todas las columnas de la tabla.
 */
export async function getAllPhotoStudentIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('student_id')

  if (error) {
    console.error('Error obteniendo fotografías:', error)
    throw new Error('No se pudieron obtener las fotografías')
  }

  return (data ?? []).map((row) => row.student_id)
}