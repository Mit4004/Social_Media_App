import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Route guard for pages that require the user to be logged in.
 * If unauthenticated, redirects to `/login`.
 */
export const ProtectedRoute = () => {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    // Redirect to login page, but save the current location so we can redirect
    // back after successful authentication.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render child routes
  return <Outlet />
}

export default ProtectedRoute
