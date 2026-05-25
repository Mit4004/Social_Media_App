import API from './axios'

/**
 * Create a new post
 * @param {Object} data - Post body: { content, media: [{url, storageType, fileType}] }
 * @returns {Promise<Object>} - Created post document
 */
export const createPost = async (data) => {
  const response = await API.post('/posts', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Fetch all posts created by a specific user
 * @param {string} id - User ID
 * @returns {Promise<Array>} - List of user posts
 */
export const getUserPosts = async (id) => {
  const response = await API.get(`/posts/user/${id}`)
  return response.data.posts || []
}

/**
 * Fetch the user's timeline posts (posts from all friends of logged-in user)
 * @returns {Promise<Array>} - Timeline posts
 */
export const getTimelinePosts = async () => {
  const response = await API.get('/posts/timeline')
  return response.data.posts || []
}

/**
 * Delete a post (own post only)
 * @param {string} id - Post ID
 * @returns {Promise<Object>} - Success response
 */
export const deletePost = async (id) => {
  const response = await API.delete(`/posts/${id}`)
  return response.data
}

/**
 * Upload files for a post (images + videos, up to 5 files, max 50MB each)
 * @param {FormData} formData - Multipart form containing "files"
 * @returns {Promise<Object>} - Contains list of uploaded file details { urls, files }
 */
export const uploadPostMedia = async (formData) => {
  const response = await API.post('/upload/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

/**
 * Like a post
 * @param {string} id - Post ID
 * @returns {Promise<Object>} - Success response
 */
export const likePost = async (id) => {
  const response = await API.post(`/posts/${id}/like`)
  return response.data
}

/**
 * Unlike a post
 * @param {string} id - Post ID
 * @returns {Promise<Object>} - Success response
 */
export const unlikePost = async (id) => {
  const response = await API.delete(`/posts/${id}/like`)
  return response.data
}
