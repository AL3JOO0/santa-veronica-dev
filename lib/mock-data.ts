import type {
  University,
  EventItem,
  Student,
  Photo,
  Activity,
} from './types'

const GALLERY = [
  '/gallery/portrait-1.png',
  '/gallery/portrait-2.png',
  '/gallery/portrait-3.png',
  '/gallery/portrait-4.png',
]

export const universities: University[] = [
  {
    id: 'u1',
    name: 'Universidad Nacional',
    short_name: 'UN',
    description: 'Institución pública con más de 150 años de historia y campus principal en la capital.',
    location: 'Bogotá, Colombia',
    created_at: '2025-11-02T10:00:00Z',
    active: false,
    updated_at: null
  },
  {
    id: 'u2',
    name: 'Universidad de los Andes',
    short_name: 'UA',
    description: 'Universidad privada reconocida por su excelencia académica y su campus urbano.',
    location: 'Bogotá, Colombia',
    created_at: '2025-12-14T10:00:00Z',
    active: false,
    updated_at: null
  },
  {
    id: 'u3',
    name: 'Universidad del Valle',
    short_name: 'UV',
    description: 'Principal universidad pública del suroccidente colombiano.',
    location: 'Cali, Colombia',
    created_at: '2026-01-20T10:00:00Z',
    active: false,
    updated_at: null
  },
  {
    id: 'u4',
    name: 'Universidad Pontificia',
    short_name: 'UP',
    description: 'Universidad privada con tradición en humanidades e ingeniería.',
    location: 'Medellín, Colombia',
    created_at: '2026-02-08T10:00:00Z',
    active: false,
    updated_at: null
  }
]

export const events: EventItem[] = [
  {
    id: 'e1',
    universityId: 'u1',
    name: 'Graduación 2026',
    description: 'Ceremonia de grado de las facultades de ingeniería y ciencias.',
    date: '2026-06-15',
    cover: '/covers/graduacion.png',
    status: 'activo',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'e2',
    universityId: 'u1',
    name: 'Ceremonia de honores',
    description: 'Reconocimiento a los mejores promedios del semestre.',
    date: '2026-05-10',
    cover: '/covers/ceremonia.png',
    status: 'activo',
    createdAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'e3',
    universityId: 'u2',
    name: 'Grado Facultad de Derecho',
    description: 'Entrega de títulos de la Facultad de Derecho.',
    date: '2026-07-02',
    cover: '/covers/campus.png',
    status: 'activo',
    createdAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'e4',
    universityId: 'u3',
    name: 'Graduación Medicina',
    description: 'Ceremonia de grado del programa de Medicina.',
    date: '2026-08-18',
    cover: '/covers/ceremonia.png',
    status: 'borrador',
    createdAt: '2026-03-18T10:00:00Z',
  },
]

const firstNames = [
  'Juan',
  'María',
  'Camilo',
  'Valentina',
  'Andrés',
  'Laura',
  'Sebastián',
  'Daniela',
]
const lastNames = [
  'Pérez',
  'Gómez',
  'Rodríguez',
  'Martínez',
  'López',
  'Ramírez',
  'Torres',
  'Vargas',
]
const programs = [
  'Ingeniería de Sistemas',
  'Medicina',
  'Derecho',
  'Arquitectura',
  'Administración',
  'Diseño Industrial',
]

function makeStudents(): Student[] {
  const list: Student[] = []
  const perEvent: Record<string, number> = { e1: 6, e2: 4, e3: 5, e4: 0 }
  let n = 0
  for (const [eventId, count] of Object.entries(perEvent)) {
    for (let i = 0; i < count; i++) {
      const fn = firstNames[n % firstNames.length]
      const ln = lastNames[(n + 3) % lastNames.length]
      list.push({
        id: `s${n + 1}`,
        eventId,
        firstName: fn,
        lastName: ln,
        code: `20${26}${String(1000 + n)}`,
        program: programs[n % programs.length],
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@correo.edu`,
        status: 'activo',
        createdAt: '2026-03-20T10:00:00Z',
      })
      n++
    }
  }
  return list
}

export const students: Student[] = makeStudents()

function makePhotos(): Photo[] {
  const list: Photo[] = []
  let p = 0
  for (const s of students) {
    // Assign 0-4 photos per student for variety
    const count = s.id === 's5' ? 0 : (parseInt(s.id.slice(1)) % 4) + 1
    for (let i = 0; i < count; i++) {
      list.push({
        id: `p${p + 1}`,
        studentId: s.id,
        fileName: `${s.code}_foto_${i + 1}.jpg`,
        url: GALLERY[(p + i) % GALLERY.length],
        uploadedAt: '2026-03-22T14:30:00Z',
      })
      p++
    }
  }
  return list
}

export const photos: Photo[] = makePhotos()

export const activities: Activity[] = [
  {
    id: 'a1',
    type: 'photo',
    action: 'subió',
    label: '12 fotografías a Juan Pérez',
    at: '2026-03-22T14:30:00Z',
  },
  {
    id: 'a2',
    type: 'event',
    action: 'creó',
    label: 'el evento Graduación 2026',
    at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'a3',
    type: 'student',
    action: 'creó',
    label: '6 estudiantes en Graduación 2026',
    at: '2026-03-20T10:00:00Z',
  },
]

export const galleryPool = GALLERY
