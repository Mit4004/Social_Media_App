import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

API.interceptors.request.use(
  // Attaches the JWT session token to outgoing request headers if present in localStorage.
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  // Handles request configuration errors by rejecting the promise.
  (error) => {
    return Promise.reject(error)
  }
)

export default API
