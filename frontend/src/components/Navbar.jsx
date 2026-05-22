import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getFriendRequests } from '../api/friend.api'

// Renders the sticky top navigation bar with search links, friend requests badge, and current user avatar
export const Navbar = () => {
  const { user } = useAuth()

  const { data: requests = [] } = useQuery({
    queryKey: ['friendRequestsCount'],
    queryFn: getFriendRequests,
    refetchInterval: 10000,
    enabled: !!user,
  })

  const requestCount = requests.length

  return (
    <nav className="h-[60px] w-full sticky top-0 bg-card/90 backdrop-blur-md border-b border-border/60 z-50 flex items-center justify-between px-6 transition-colors duration-300">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center text-white font-black text-base shadow-md shadow-accent/25 group-hover:scale-105 transition-transform duration-200">
          S
        </div>
        <span className="font-bold text-base text-primary tracking-tight hidden sm:block">
          SocialApp
        </span>
      </Link>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-2">

        {/* Friend Requests Bell */}
        <Link
          to="/requests"
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-base transition-all duration-200"
          title="Friend Requests"
        >
          <Bell size={18} />
          {requestCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-danger text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-card">
              {requestCount > 9 ? '9+' : requestCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        {user && (
          <Link
            to={`/user/${user._id || user.id}`}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity py-1 px-1.5 rounded-[10px] hover:bg-base"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold overflow-hidden ring-2 ring-border">
              {user.photo || user.profilePicture ? (
                <img
                  src={user.photo || user.profilePicture}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-primary hidden sm:inline max-w-[80px] truncate">
              {user.firstName}
            </span>
          </Link>
        )}
      </div>

    </nav>
  )
}

export default Navbar
