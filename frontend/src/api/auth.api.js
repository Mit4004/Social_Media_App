import API from './axios'

/**
 * Register a new user
 * @param {Object} data - Registration details: { firstName, lastName, email, mobile, password }
 * @returns {Promise<Object>} - Backend response data
 */
export const registerUser = async (data) => {
  const response = await API.post('/auth/register', data)
  return response.data
}

/**
 * Log in an existing user
 * @param {Object} data - Credentials: { email, password }
 * @returns {Promise<Object>} - Returns { token, user }
 */
export const loginUser = async (data) => {
  const response = await API.post('/auth/login', data)
  return response.data
}
