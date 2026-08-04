import { env } from '../config/env'

interface CloudinaryUploadResponse {
  secure_url: string
}

export async function uploadImage(file: File): Promise<string> {
  if (!env.cloudinaryCloud || !env.cloudinaryPreset) {
    throw new Error('Cloudinary não configurado')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', env.cloudinaryPreset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${env.cloudinaryCloud}/image/upload`,
    { method: 'POST', body: form }
  )
  if (!res.ok) throw new Error('Falha no upload da imagem')
  const data = (await res.json()) as CloudinaryUploadResponse
  return data.secure_url
}
