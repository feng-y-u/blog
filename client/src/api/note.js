import client from './client'

export const getPublicNotes = params => client.get('/notes/public', { params })
export const getNotes = params => client.get('/notes', { params })
export const getNote = id => client.get(`/notes/${id}`)
export const createNote = data => client.post('/notes', data)
export const updateNote = (id, data) => client.put(`/notes/${id}`, data)
export const deleteNote = id => client.delete(`/notes/${id}`)
export const exportNote = id => client.get(`/notes/${id}/export`, { responseType: 'blob' })
