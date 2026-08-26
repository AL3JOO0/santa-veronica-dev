import {
  createUniversityAction,
  deleteUniversityAction,
  updateUniversityAction,
} from '@/app/actions/universities'
import type { University } from '@/lib/types'

export type CreateUniversityInput = Omit<
  University,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateUniversityInput = Partial<CreateUniversityInput>

export async function getUniversities(): Promise<University[]> {
  const response = await fetch('/api/universities', { cache: 'no-store' })
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; data?: University[]; message?: string }
    | null

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || 'No se pudieron obtener las universidades.')
  }

  return result.data || []
}

export function createUniversity(input: CreateUniversityInput) {
  return createUniversityAction(input)
}

export function updateUniversity(id: string, input: UpdateUniversityInput) {
  return updateUniversityAction(id, input)
}

export async function deleteUniversity(id: string): Promise<void> {
  await deleteUniversityAction(id)
}
