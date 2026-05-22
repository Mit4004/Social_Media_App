import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

// Provides authentication state and actions (login, logout, updateProfile) to child components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null
  })

  // Sets authenticated user and token in both react state and localStorage
  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
  }

  // Clears authenticated user and token from state and localStorage
  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  // Updates current user details in state and localStorage
  const updateProfile = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to consume the AuthContext state and actions
export const useAuth = () => useContext(AuthContext)