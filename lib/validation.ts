import { z } from 'zod'

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/upload-constraints'

export const idSchema = z.string().trim().uuid('El identificador no es válido.')

const eventStatusSchema = z.enum([
  'activo',
  'borrador',
  'cerrado',
  'archivado',
])

const studentStatusSchema = z.enum([
  'PENDING',
  'SELECTION_IN_PROGRESS',
  'SELECTION_SENT',
])

const optionalEmailSchema = z
  .union([z.string().trim().email('El correo no es válido.').max(254), z.literal(''), z.null()])
  .transform((value) => value || null)

export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
  remember: z.boolean().optional().default(false),
}).strict()

export const createEventSchema = z.object({
  universityId: idSchema,
  name: z.string().trim().min(1, 'El nombre del evento es obligatorio.').max(160),
  description: z.string().trim().max(2_000).default(''),
  date: z.iso.date('La fecha del evento no es válida.'),
  password: z.string().trim().min(8, 'La contraseña debe tener mínimo 8 caracteres.').max(100),
  status: eventStatusSchema,
}).strict()

export const updateEventSchema = createEventSchema.extend({
  id: idSchema,
  password: z
    .union([
      z.string().trim().min(8, 'La contraseña debe tener mínimo 8 caracteres.').max(100),
      z.literal(''),
      z.undefined(),
    ])
    .optional(),
}).strict()

export const universitySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(160),
  short_name: z.string().trim().min(1).max(20),
  description: z.string().trim().max(2_000).default(''),
  location: z.string().trim().max(200).default(''),
  active: z.boolean(),
  notification_email: optionalEmailSchema,
}).strict()

export const updateUniversitySchema = universitySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'No hay cambios para guardar.',
)

export const createStudentSchema = z.object({
  eventId: idSchema,
  documentNumber: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: optionalEmailSchema,
  password: z.string().min(8).max(100),
  status: studentStatusSchema.default('PENDING'),
}).strict()

export const updateStudentSchema = createStudentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'No hay cambios para guardar.',
)

export const bulkStudentsSchema = z.object({
  eventId: idSchema,
  students: z.array(createStudentSchema.omit({ eventId: true })).min(1).max(40),
}).strict()

const imageTypeSchema = z.enum(ALLOWED_IMAGE_TYPES)

const uploadImageSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: imageTypeSchema,
  fileSize: z.number().int().positive().max(MAX_IMAGE_BYTES),
}).strict()

export const photoSignSchema = z.object({
  studentId: idSchema,
  filename: uploadImageSchema.shape.filename,
  mimeType: uploadImageSchema.shape.mimeType,
  fileSize: uploadImageSchema.shape.fileSize,
  preview: uploadImageSchema,
}).strict()

export const photoRegisterSchema = photoSignSchema.extend({
  key: z.string().trim().min(1).max(500),
  thumbnailKey: z.string().trim().min(1).max(500),
}).strict()

export const selectionSchema = z.object({
  photoIds: z.array(idSchema).min(1).max(500),
}).strict()

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || 'Los datos enviados no son válidos.'
}
