import API from './axios'

/**
 * Fetch a paginated/filtered list of users
 * @param {Object} params - Query parameters: { search, page, limit, sortBy, order }
 * @returns {Promise<Object>} - Contains users array and pagination metadata
 */
export const getUsers = async (params) => {
  const response = await API.get('/users', { params })
  return response.data
}

/**
 * Fetch a single user by ID
 * @param {string} id - The user ID to retrieve
 * @returns {Promise<Object>} - The user's detailed profile
 */
export const getUserById = async (id) => {
  const response = await API.get(`/users/${id}`)
  return response.data
}

/**
 * Update a user profile (own profile only)
 * @param {string} id - User ID
 * @param {Object} data - Updated fields: { firstName, lastName, mobile, bio }
 * @returns {Promise<Object>} - Updated user details
 */
export const updateUser = async (id, data) => {
  const response = await API.put(`/users/${id}`, data)
  return response.data
}

/**
 * Delete a user profile (own profile only)
 * @param {string} id - User ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteUser = async (id) => {
  const response = await API.delete(`/users/${id}`)
  return response.data
}

/**
 * Upload profile photo (logged-in user)
 * @param {FormData} formData - Contains the photo file under "photo" key
 * @returns {Promise<Object>} - Contains the photo URL or updated user info
 */
export const uploadProfilePhoto = async (formData) => {
  const response = await API.post('/upload/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}
