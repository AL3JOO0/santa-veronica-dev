export interface ClientGalleryPhoto {
  id: string
  fileName: string
  url: string
  hasEmbeddedWatermark: boolean
}

interface ClientGalleryData {
  photos: ClientGalleryPhoto[]
  selectedIds: string[]
  selectionStatus: string | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface GalleryResponse extends Partial<ClientGalleryData> {
  ok: boolean
  message?: string
}

export async function getClientGallery(page = 1, pageSize = 16): Promise<ClientGalleryData> {
  const response = await fetch(`/api/cliente/galeria?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const data = (await response.json().catch(() => null)) as GalleryResponse | null

  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || 'No fue posible cargar la galería.')
  }

  return {
    photos: data.photos || [],
    selectedIds: data.selectedIds || [],
    selectionStatus: data.selectionStatus || null,
    pagination: data.pagination || { page, pageSize, total: 0, totalPages: 1 },
  }
}

export async function submitClientSelection(photoIds: string[]) {
  const response = await fetch('/api/cliente/seleccion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoIds }),
  })

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; selectedIds?: string[] }
    | null

  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || 'No fue posible enviar la selección.')
  }

  return data
}
