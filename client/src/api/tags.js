import client from './client'

export const getTags = () => client.get('/tags')
export const createTag = data => client.post('/tags', data)
export const updateTag = (id, data) => client.put(`/tags/${id}`, data)
export const deleteTag = id => client.delete(`/tags/${id}`)
