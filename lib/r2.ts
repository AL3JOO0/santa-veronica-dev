import {
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Falta configurar la variable ${name}.`)
  return value
}

const customEndpoint = process.env.R2_ENDPOINT?.trim()
const endpoint = customEndpoint || `https://${required('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`

export const r2 = new S3Client({
  region: 'auto',
  endpoint,
  // R2_ENDPOINT se reserva para almacenamiento S3 compatible local
  // como MinIO. Cloudflare R2 usa R2_ACCOUNT_ID y virtual-host style.
  forcePathStyle: Boolean(customEndpoint),
  credentials: {
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
  },
})

export function getPhotoPublicUrl(storageKey: string) {
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, '')
  if (!baseUrl) return null

  const cleanKey = storageKey.replace(/^\/+/, '')
  return `${baseUrl}/${cleanKey}`
}

/**
 * Obtiene una URL de lectura para una fotografía.
 *
 * - Si existe NEXT_PUBLIC_R2_PUBLIC_URL se usa esa URL pública.
 * - Si no existe, se genera una URL GET firmada y temporal.
 *
 * Esto permite usar MinIO público durante pruebas y un bucket R2 privado
 * en producción sin cambiar la lógica de la aplicación.
 */
export async function getPhotoReadUrl(
  storageKey: string,
  expiresIn = 900,
) {
  const publicUrl = getPhotoPublicUrl(storageKey)
  if (publicUrl) return publicUrl

  const bucket = required('R2_BUCKET_NAME')
  const cleanKey = storageKey.replace(/^\/+/, '')

  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    }),
    { expiresIn },
  )
}
