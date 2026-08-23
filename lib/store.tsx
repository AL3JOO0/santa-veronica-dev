'use client'

import * as React from 'react'
import * as data from './mock-data'

import {
  getUniversities,
  createUniversity,
  updateUniversity,
  deleteUniversity,
} from './services/universities.service'

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
  
  events: EventItem[]
  students: Student[]
  photos: Photo[]
  activities: Activity[]

  // Events
  addEvent: (
    e: Omit<EventItem, 'id' | 'createdAt'>,
  ) => EventItem

  updateEvent: (
    id: string,
    e: Partial<EventItem>,
  ) => void

  deleteEvent: (
    id: string,
  ) => void

  // Students
  addStudent: (
    s: Omit<Student, 'id' | 'createdAt'>,
  ) => Student

  updateStudent: (
    id: string,
    s: Partial<Student>,
  ) => void

  deleteStudent: (
    id: string,
  ) => void

  // Photos
  addPhotos: (
    studentId: string,
    files: { fileName: string; url: string }[],
  ) => void

  deletePhoto: (
    id: string,
  ) => void

   

  getEvent: (
    id: string,
  ) => EventItem | undefined

  getStudent: (
    id: string,
  ) => Student | undefined

  eventsByUniversity: (
    universityId: string,
  ) => EventItem[]

  studentsByEvent: (
    eventId: string,
  ) => Student[]

  photosByStudent: (
    studentId: string,
  ) => Photo[]
}

const StoreContext =
  React.createContext<StoreValue | null>(null)

export function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {

  /*
   * ============================
   * STATE
   * ============================
   */


  // Por ahora continúan usando mock-data.
  // Los refactorizaremos cuando lleguemos a Events.
  const [events, setEvents] =
    React.useState<EventItem[]>(data.events)

  const [students, setStudents] =
    React.useState<Student[]>(data.students)

  const [photos, setPhotos] =
    React.useState<Photo[]>(data.photos)

  const [activities, setActivities] =
    React.useState<Activity[]>(data.activities)


  /*
   * ============================
   * ACTIVITY LOGGER
   * ============================
   */

  const logActivity = React.useCallback(
    (
      type: ActivityType,
      action: Activity['action'],
      label: string,
    ) => {
      setActivities((prev) => [
        {
          id: uid('a'),
          type,
          action,
          label,
          at: nowISO(),
        },
        ...prev,
      ])
    },
    [],
  )


  /*
   * ============================
   * LOAD UNIVERSITIES
   * ============================
   */


  /*
   * ============================
   * STORE
   * ============================
   */

  const value = React.useMemo<StoreValue>(() => {

    return {

      

      events,

      students,

      photos,

      activities,



     


      /*
       * ==========================
       * EVENTS
       * ==========================
       */

      addEvent: (event) => {

        const created: EventItem = {
          ...event,
          id: uid('e'),
          createdAt: nowISO(),
        }

        setEvents((prev) => [
          created,
          ...prev,
        ])

        logActivity(
          'event',
          'creó',
          `el evento ${event.name}`,
        )

        return created
      },


      updateEvent: (
        id,
        event,
      ) => {

        setEvents((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...event,
                }
              : item,
          ),
        )

        logActivity(
          'event',
          'editó',
          `el evento ${event.name ?? ''}`.trim(),
        )
      },


      deleteEvent: (id) => {

        const studentIds =
          students
            .filter(
              (student) =>
                student.eventId === id,
            )
            .map(
              (student) => student.id,
            )

        setPhotos((prev) =>
          prev.filter(
            (photo) =>
              !studentIds.includes(
                photo.studentId,
              ),
          ),
        )

        setStudents((prev) =>
          prev.filter(
            (student) =>
              student.eventId !== id,
          ),
        )

        const event =
          events.find(
            (item) => item.id === id,
          )

        setEvents((prev) =>
          prev.filter(
            (item) => item.id !== id,
          ),
        )

        logActivity(
          'event',
          'eliminó',
          `el evento ${event?.name ?? ''}`.trim(),
        )
      },


      /*
       * ==========================
       * STUDENTS
       * ==========================
       */

      addStudent: (student) => {

        const created: Student = {
          ...student,
          id: uid('s'),
          createdAt: nowISO(),
        }

        setStudents((prev) => [
          created,
          ...prev,
        ])

        logActivity(
          'student',
          'creó',
          `al estudiante ${student.firstName} ${student.lastName}`,
        )

        return created
      },


      updateStudent: (
        id,
        student,
      ) => {

        setStudents((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...student,
                }
              : item,
          ),
        )

        logActivity(
          'student',
          'editó',
          'un estudiante',
        )
      },


      deleteStudent: (id) => {

        setPhotos((prev) =>
          prev.filter(
            (photo) =>
              photo.studentId !== id,
          ),
        )

        const student =
          students.find(
            (item) => item.id === id,
          )

        setStudents((prev) =>
          prev.filter(
            (item) => item.id !== id,
          ),
        )

        logActivity(
          'student',
          'eliminó',
          student
            ? `al estudiante ${student.firstName} ${student.lastName}`
            : 'al estudiante',
        )
      },


      /*
       * ==========================
       * PHOTOS
       * ==========================
       */

      addPhotos: (
        studentId,
        files,
      ) => {

        const created: Photo[] =
          files.map((file) => ({
            id: uid('p'),
            studentId,
            fileName: file.fileName,
            url: file.url,
            uploadedAt: nowISO(),
          }))

        setPhotos((prev) => [
          ...created,
          ...prev,
        ])

        const student =
          students.find(
            (item) =>
              item.id === studentId,
          )

        logActivity(
          'photo',
          'subió',
          `${files.length} fotografía${
            files.length === 1
              ? ''
              : 's'
          } a ${
            student
              ? `${student.firstName} ${student.lastName}`
              : 'un estudiante'
          }`,
        )
      },


      deletePhoto: (id) => {

        setPhotos((prev) =>
          prev.filter(
            (photo) =>
              photo.id !== id,
          ),
        )
      },


      /*
       * ==========================
       * SELECTORS
       * ==========================
       */

      

      getEvent: (id) =>
        events.find(
          (event) =>
            event.id === id,
        ),

      getStudent: (id) =>
        students.find(
          (student) =>
            student.id === id,
        ),

      eventsByUniversity: (
        universityId,
      ) =>
        events.filter(
          (event) =>
            event.universityId ===
            universityId,
        ),

      studentsByEvent: (
        eventId,
      ) =>
        students.filter(
          (student) =>
            student.eventId === eventId,
        ),

      photosByStudent: (
        studentId,
      ) =>
        photos.filter(
          (photo) =>
            photo.studentId === studentId,
        ),
    }

  }, [
    
    events,
    students,
    photos,
    activities,
    logActivity,
  ])


  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  )
}


export function useStore() {

  const ctx =
    React.useContext(StoreContext)

  if (!ctx) {
    throw new Error(
      'useStore must be used within StoreProvider',
    )
  }

  return ctx
}