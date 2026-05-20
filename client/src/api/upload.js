import client from './client'

export function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  return client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
