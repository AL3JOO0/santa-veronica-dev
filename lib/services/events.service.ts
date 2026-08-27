import {
  deleteEventAction,
  updateEventAction,
} from '@/app/actions/events'
import type { EventItem, Status } from '@/lib/types'

export interface UpdateEventInput {
  universityId?: string
  name?: string
  description?: string
  date?: string
  status?: Status
  password?: string
}

export async function getEvents(): Promise<EventItem[]> {
  const response = await fetch('/api/events', { cache: 'no-store' })
  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; data?: EventItem[]; message?: string }
    | null

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || 'No se pudieron obtener los eventos.')
  }

  return result.data || []
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput,
): Promise<EventItem> {
  if (
    !input.universityId ||
    !input.name ||
    input.description === undefined ||
    !input.date ||
    !input.status
  ) {
    throw new Error('Faltan datos obligatorios del evento.')
  }

  return updateEventAction({ id, ...input })
}

export async function deleteEvent(id: string) {
  await deleteEventAction(id)
}
