import client from './client'

export const getNotes = params => client.get('/notes', { params })
export const getNote = id => client.get(`/notes/${id}`)
export const createNote = data => {
  if (data instanceof FormData) return client.post('/notes', data)
  return client.post('/notes', data)
}
export const updateNote = (id, data) => client.put(`/notes/${id}`, data)
export const deleteNote = id => client.delete(`/notes/${id}`)
export const exportNote = id => client.get(`/notes/${id}/export`, { responseType: 'blob' })
