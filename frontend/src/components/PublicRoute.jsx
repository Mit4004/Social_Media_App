import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard for public auth pages (Login, Register).
 * If user is already logged in, redirects them to the main feed (`/`).
 */
export const PublicRoute = () => {
  const { token } = useAuth()

  if (token) {
    // Already authenticated, send them to the homepage (Timeline)
    return <Navigate to="/" replace />
  }

  // Render child routes
  return <Outlet />
}

export default PublicRoute
