import client from './client'

export const getPosts = params => client.get('/posts', { params })
export const getPostBySlug = slug => client.get(`/posts/${slug}`)
export const getPost = id => client.get(`/posts/id/${id}`)
export const createPost = data => client.post('/posts', data)
export const updatePost = (id, data) => client.put(`/posts/${id}`, data)
export const deletePost = id => client.delete(`/posts/${id}`)
export const updatePostStatus = (id, status) => client.patch(`/posts/${id}/status`, { status })

export const getCategories = () => client.get('/categories')
export const getCategoryBySlug = slug => client.get(`/categories/${slug}`)
export const createCategory = data => client.post('/categories', data)
export const updateCategory = (id, data) => client.put(`/categories/${id}`, data)
export const deleteCategory = id => client.delete(`/categories/${id}`)

export const getTags = () => client.get('/tags')
export const createTag = data => client.post('/tags', data)
export const updateTag = (id, data) => client.put(`/tags/${id}`, data)
export const deleteTag = id => client.delete(`/tags/${id}`)
