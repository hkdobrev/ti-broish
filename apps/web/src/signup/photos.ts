import type { PhotoInput } from './reports-validate'

const MAX_EDGE = 1400
const MAX_BYTES = 260_000

export async function compressPhoto(file: File): Promise<PhotoInput> {
  if (!file.type.startsWith('image/')) throw new Error('Файлът не е снимка.')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Снимката не се чете. Използвай JPG или PNG.')
  })
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Снимката не се чете.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  let quality = 0.62
  let blob = await canvasToJpeg(canvas, quality)
  while (blob.size > MAX_BYTES && quality > 0.35) {
    quality -= 0.12
    blob = await canvasToJpeg(canvas, quality)
  }
  if (blob.size > MAX_BYTES) throw new Error('Снимката е твърде голяма. Опитай с друга.')
  const data = await blobToBase64(blob)
  return { contentType: 'image/jpeg', data }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Снимката не се чете.'))), 'image/jpeg', quality)
  })
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = String(reader.result ?? '')
      const comma = value.indexOf(',')
      resolve(comma >= 0 ? value.slice(comma + 1) : value)
    }
    reader.onerror = () => reject(new Error('Снимката не се чете.'))
    reader.readAsDataURL(blob)
  })
}
