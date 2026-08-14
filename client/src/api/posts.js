import client from './client'

export const getPosts = params => client.get('/posts', { params })
export const getPostBySlug = slug => client.get(`/posts/${slug}`)
export const getAdjacentPosts = id => client.get(`/posts/${id}/adjacent`)
export const getPost = id => client.get(`/posts/id/${id}`)
export const createPost = data => client.post('/posts', data)
export const updatePost = (id, data) => client.put(`/posts/${id}`, data)
export const deletePost = id => client.delete(`/posts/${id}`)
export const updatePostStatus = (id, status) => client.patch(`/posts/${id}/status`, { status })
