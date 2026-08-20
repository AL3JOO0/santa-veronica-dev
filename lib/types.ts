export type Status =
  | 'activo'
  | 'borrador'
  | 'cerrado'
  | 'archivado'

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
  firstName: string
  lastName: string
  code: string
  program: string
  email: string
  status: Status
  createdAt: string
}

export interface Photo {
  id: string
  studentId: string
  fileName: string
  url: string
  uploadedAt: string
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