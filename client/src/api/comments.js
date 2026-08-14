import client from './client'

// Public
export const getPostComments = postId => client.get(`/posts/${postId}/comments`)
export const createComment = (postId, data) => client.post(`/posts/${postId}/comments`, data)

// Admin
export const getComments = params => client.get('/comments', { params })
export const updateComment = (id, data) => client.put(`/comments/${id}`, data)
export const deleteComment = id => client.delete(`/comments/${id}`)
