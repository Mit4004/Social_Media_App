import API from './axios'

/**
 * Send a friend request to a user
 * @param {string} id - Receiver's user ID
 * @returns {Promise<Object>} - Success response
 */
export const sendFriendRequest = async (id) => {
  const response = await API.post(`/friends/request/${id}`)
  return response.data
}

/**
 * Accept an incoming friend request
 * @param {string} id - FriendRequest document ID (from request card)
 * @returns {Promise<Object>} - Success response
 */
export const acceptFriendRequest = async (id) => {
  const response = await API.post(`/friends/accept/${id}`)
  return response.data
}

/**
 * Reject an incoming friend request
 * @param {string} id - FriendRequest document ID
 * @returns {Promise<Object>} - Success response
 */
export const rejectFriendRequest = async (id) => {
  const response = await API.post(`/friends/reject/${id}`)
  return response.data
}

/**
 * Unfriend an existing friend
 * @param {string} id - Other user's user ID
 * @returns {Promise<Object>} - Success response
 */
export const unfriend = async (id) => {
  const response = await API.delete(`/friends/unfriend/${id}`)
  return response.data
}

/**
 * Get incoming pending friend requests for the logged-in user
 * @returns {Promise<Array>} - List of pending friend requests
 */
export const getFriendRequests = async () => {
  const response = await API.get('/friends/requests')
  return response.data.requests
}

/**
 * Get the list of all friends for a user (or logged-in user if not specified)
 * @param {string} [userId] - Optional user ID to get friends for
 * @returns {Promise<Array>} - List of friends
 */
export const getFriendsList = async (userId) => {
  const url = userId ? `/friends/list?userId=${userId}` : '/friends/list'
  const response = await API.get(url)
  return response.data.friends
}
