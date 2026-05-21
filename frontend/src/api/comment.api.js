import API from './axios'

/**
 * Add a comment to a post
 * @param {string} postId - Post ID
 * @param {Object} data - Comment details: { text }
 * @returns {Promise<Object>} - Created comment document
 */
export const createComment = async (postId, data) => {
  const response = await API.post(`/comments/${postId}`, data)
  return response.data
}

/**
 * Get all comments for a post (ordered oldest first)
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} - List of comments
 */
export const getComments = async (postId) => {
  const response = await API.get(`/comments/${postId}`)
  return response.data
}

/**
 * Delete a comment (own comment only)
 * @param {string} id - Comment ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteComment = async (id) => {
  const response = await API.delete(`/comments/${id}`)
  return response.data
}
