export type Status =
  | 'activo'
  | 'borrador'
  | 'cerrado'
  | 'archivado'
  export type StudentStatus =
  | 'PENDING'
  | 'SELECTION_IN_PROGRESS'
  | 'SELECTION_SENT'

export interface University {
  id: string
  name: string
  short_name: string
  description: string
  location: string
  active: boolean
  created_at: string
  updated_at: string | null
}

export interface EventItem {
  id: string
  universityId: string
  name: string
  description: string
  date: string
  status: Status
  createdAt: string
  updatedAt: string | null
}

export interface Student {
  id: string
  eventId: string
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  status: StudentStatus
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id: string
  studentId: string
  storageKey: string
  thumbnailKey: string | null
  originalFilename: string
  mimeType: string
  fileSize: number
  createdAt: string
}

export type ActivityType =
  | 'university'
  | 'event'
  | 'student'
  | 'photo'

export interface Activity {
  id: string
  type: ActivityType
  action: 'creó' | 'editó' | 'eliminó' | 'subió'
  label: string
  at: string
}