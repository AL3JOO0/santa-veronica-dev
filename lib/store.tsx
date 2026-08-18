'use client'

import * as React from 'react'
import * as data from './mock-data'
import { supabase } from './supabase'
import type {
  University,
  EventItem,
  Student,
  Photo,
  Activity,
  ActivityType,
} from './types'

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`
}

function nowISO() {
  return new Date().toISOString()
}

interface StoreValue {
  universities: University[]
  events: EventItem[]
  students: Student[]
  photos: Photo[]
  activities: Activity[]

  // Universities
  addUniversity: (
  u: Omit<University, 'id' | 'created_at' | 'updated_at'>
) => Promise<University>
 updateUniversity: (  id: string,  u: Partial<University>) => Promise<void>
  deleteUniversity: (id: string) => Promise<void>

  // Events
  addEvent: (e: Omit<EventItem, 'id' | 'createdAt'>) => EventItem
  updateEvent: (id: string, e: Partial<EventItem>) => void
  deleteEvent: (id: string) => void

  // Students
  addStudent: (s: Omit<Student, 'id' | 'createdAt'>) => Student
  updateStudent: (id: string, s: Partial<Student>) => void
  deleteStudent: (id: string) => void

  // Photos
  addPhotos: (studentId: string, files: { fileName: string; url: string }[]) => void
  deletePhoto: (id: string) => void

  // Selectors
  getUniversity: (id: string) => University | undefined
  getEvent: (id: string) => EventItem | undefined
  getStudent: (id: string) => Student | undefined
  eventsByUniversity: (universityId: string) => EventItem[]
  studentsByEvent: (eventId: string) => Student[]
  photosByStudent: (studentId: string) => Photo[]
}

const StoreContext = React.createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [universities, setUniversities] = React.useState<University[]>([])
  const [events, setEvents] = React.useState<EventItem[]>(data.events)
  const [students, setStudents] = React.useState<Student[]>(data.students)
  const [photos, setPhotos] = React.useState<Photo[]>(data.photos)
  const [activities, setActivities] = React.useState<Activity[]>(data.activities)

  const logActivity = React.useCallback(
    (type: ActivityType, action: Activity['action'], label: string) => {
      setActivities((prev) => [
        { id: uid('a'), type, action, label, at: nowISO() },
        ...prev,
      ])
    },
    [],
  )

  const value = React.useMemo<StoreValue>(() => {
    return {
      universities,
      events,
      students,
      photos,
      activities,

      addUniversity: async (u) => {
  const { data: created, error } = await supabase
    .from('institutions')
    .insert({
      name: u.name,
      short_name: u.short_name,
      description: u.description,
      location: u.location,
      active: u.active,
    })
    .select()
    .single()

  if (error) {
  console.error('Error creando institución')
  console.error('code:', error.code)
  console.error('message:', error.message)
  console.error('details:', error.details)
  console.error('hint:', error.hint)

  throw new Error(error.message)
}

  setUniversities((prev) => [created, ...prev])

  logActivity(
    'university',
    'creó',
    `la universidad ${created.name}`,
  )

  return created
},
      updateUniversity: async (id, u) => {
  const { data, error } = await supabase
    .from('institutions')
    .update({
      name: u.name,
      active: u.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error actualizando institución:', error)
    throw new Error('No se pudo actualizar la universidad')
  }

  setUniversities((prev) =>
    prev.map((item) =>
      item.id === id ? data : item
    )
  )

  logActivity(
    'university',
    'editó',
    `la universidad ${data.name}`,
  )
},
   deleteUniversity: async (id) => {
  const university = universities.find(
    (item) => item.id === id
  )

  if (!university) {
    return
  }

  const { error } = await supabase
    .from('institutions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error eliminando institución:', error)
    throw new Error('No se pudo eliminar la universidad')
  }

  setUniversities((prev) =>
    prev.filter((item) => item.id !== id)
  )

  logActivity(
    'university',
    'eliminó',
    `la universidad ${university.name}`,
  )
},

      addEvent: (e) => {
        const created: EventItem = { ...e, id: uid('e'), createdAt: nowISO() }
        setEvents((prev) => [created, ...prev])
        logActivity('event', 'creó', `el evento ${e.name}`)
        return created
      },
      updateEvent: (id, e) => {
        setEvents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...e } : item)),
        )
        logActivity('event', 'editó', `el evento ${e.name ?? ''}`.trim())
      },
      deleteEvent: (id) => {
        const studentIds = students
          .filter((s) => s.eventId === id)
          .map((s) => s.id)
        setPhotos((prev) => prev.filter((p) => !studentIds.includes(p.studentId)))
        setStudents((prev) => prev.filter((s) => s.eventId !== id))
        const ev = events.find((x) => x.id === id)
        setEvents((prev) => prev.filter((x) => x.id !== id))
        logActivity('event', 'eliminó', `el evento ${ev?.name ?? ''}`.trim())
      },

      addStudent: (s) => {
        const created: Student = { ...s, id: uid('s'), createdAt: nowISO() }
        setStudents((prev) => [created, ...prev])
        logActivity(
          'student',
          'creó',
          `al estudiante ${s.firstName} ${s.lastName}`,
        )
        return created
      },
      updateStudent: (id, s) => {
        setStudents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...s } : item)),
        )
        logActivity('student', 'editó', `un estudiante`)
      },
      deleteStudent: (id) => {
        setPhotos((prev) => prev.filter((p) => p.studentId !== id))
        const st = students.find((x) => x.id === id)
        setStudents((prev) => prev.filter((x) => x.id !== id))
        logActivity(
          'student',
          'eliminó',
          `al estudiante ${st ? `${st.firstName} ${st.lastName}` : ''}`.trim(),
        )
      },

      addPhotos: (studentId, files) => {
        const created: Photo[] = files.map((f) => ({
          id: uid('p'),
          studentId,
          fileName: f.fileName,
          url: f.url,
          uploadedAt: nowISO(),
        }))
        setPhotos((prev) => [...created, ...prev])
        const st = students.find((x) => x.id === studentId)
        logActivity(
          'photo',
          'subió',
          `${files.length} fotografía${files.length === 1 ? '' : 's'} a ${
            st ? `${st.firstName} ${st.lastName}` : 'un estudiante'
          }`,
        )
      },
      deletePhoto: (id) => {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
      },

      getUniversity: (id) => universities.find((u) => u.id === id),
      getEvent: (id) => events.find((e) => e.id === id),
      getStudent: (id) => students.find((s) => s.id === id),
      eventsByUniversity: (universityId) =>
        events.filter((e) => e.universityId === universityId),
      studentsByEvent: (eventId) =>
        students.filter((s) => s.eventId === eventId),
      photosByStudent: (studentId) =>
        photos.filter((p) => p.studentId === studentId),
    }
  }, [universities, events, students, photos, activities, logActivity])
React.useEffect(() => {
  async function loadUniversities() {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando instituciones:', error)
      return
    }

    setUniversities(data ?? [])
  }

  loadUniversities()
}, [])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>

}

export function useStore() {
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
