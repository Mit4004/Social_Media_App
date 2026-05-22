import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

import Login from './pages/Login' 
import Register from './pages/Register'
import Timeline from './pages/Timeline'
import UsersList from './pages/UsersList'
import FriendRequests from './pages/FriendRequests'
import UserDetail from './pages/UserDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

// Main application component setup with routing and TanStack Query client providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Main App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Timeline />} />
            <Route path="/people" element={<UsersList />} />
            <Route path="/requests" element={<FriendRequests />} />
            <Route path="/user/:id" element={<UserDetail />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Global Alert Notification Center */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </QueryClientProvider>
  )
}

export default App
