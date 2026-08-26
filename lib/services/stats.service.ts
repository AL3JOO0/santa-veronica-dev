interface EventCounts {
  studentCount: number
  photoCount: number
}

interface DashboardStats {
  studentsCount: number
  photosCount: number
  countsByEvent: Record<string, EventCounts>
}

let pendingRequest: Promise<DashboardStats> | null = null
let cached: { data: DashboardStats; expiresAt: number } | null = null

export async function getDashboardStats(force = false): Promise<DashboardStats> {
  if (!force && cached && cached.expiresAt > Date.now()) return cached.data
  if (!force && pendingRequest) return pendingRequest

  pendingRequest = fetch('/api/stats', { cache: 'no-store' })
    .then(async (response) => {
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; data?: DashboardStats; message?: string }
        | null

      if (!response.ok || !result?.ok || !result.data) {
        throw new Error(result?.message || 'No se pudieron obtener las estadísticas.')
      }

      cached = { data: result.data, expiresAt: Date.now() + 15_000 }
      return result.data
    })
    .finally(() => {
      pendingRequest = null
    })

  return pendingRequest
}
