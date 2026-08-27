const PREVIEW_MAX_DIMENSION = 2_000
const PREVIEW_QUALITY = 0.84
const WATERMARK_TEXT = 'SANTA VERÓNICA'

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

export interface WatermarkedPreview {
  blob: Blob
  filename: string
  mimeType: string
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file)
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      dispose: () => bitmap.close(),
    }
  }

  const objectUrl = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  image.src = objectUrl
  await image.decode()

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(objectUrl),
  }
}

function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(24, Math.min(72, Math.round(Math.min(width, height) * 0.045)))
  const diagonal = Math.hypot(width, height)

  context.save()
  context.translate(width / 2, height / 2)
  context.rotate(-18 * Math.PI / 180)
  context.font = `700 ${fontSize}px Arial, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineWidth = Math.max(2, fontSize * 0.06)
  context.strokeStyle = 'rgba(0, 0, 0, 0.24)'
  context.fillStyle = 'rgba(255, 255, 255, 0.48)'

  const textWidth = context.measureText(WATERMARK_TEXT).width
  const stepX = textWidth + fontSize * 3
  const stepY = fontSize * 4.5

  for (let y = -diagonal; y <= diagonal; y += stepY) {
    const offset = Math.round(y / stepY) % 2 === 0 ? 0 : stepX / 2
    for (let x = -diagonal; x <= diagonal; x += stepX) {
      context.strokeText(WATERMARK_TEXT, x + offset, y)
      context.fillText(WATERMARK_TEXT, x + offset, y)
    }
  }

  context.restore()
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('No fue posible generar la vista con marca de agua.'))
      },
      'image/webp',
      PREVIEW_QUALITY,
    )
  })
}

export async function createWatermarkedPreview(file: File): Promise<WatermarkedPreview> {
  const image = await decodeImage(file)

  try {
    const scale = Math.min(1, PREVIEW_MAX_DIMENSION / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('El navegador no permite procesar la imagen.')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image.source, 0, 0, width, height)
    drawWatermark(context, width, height)

    const blob = await canvasToBlob(canvas)
    const mimeType = blob.type || 'image/webp'
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'webp'
    const basename = file.name.replace(/\.[^.]+$/, '').slice(0, 220) || 'fotografia'

    return {
      blob,
      filename: `${basename}-preview.${extension}`,
      mimeType,
    }
  } finally {
    image.dispose()
  }
}
