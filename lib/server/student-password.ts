import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

export function normalizeDocumentNumber(value: string) {
  const trimmed = value.trim()
  return /^[\d.\-\s]+$/.test(trimmed) ? trimmed.replace(/\D/g, '') : trimmed
}

export function validateStudentPassword(password: string) {
  const value = password.trim()
  if (value.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres.')
  if (value.length > 100) throw new Error('La contraseña supera la longitud permitida.')
  return value
}

export async function hashStudentPassword(password: string) {
  return bcrypt.hash(validateStudentPassword(password), BCRYPT_ROUNDS)
}

export async function verifyStudentPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
