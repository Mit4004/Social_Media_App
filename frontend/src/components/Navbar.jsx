import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Home, Users, UserPlus, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getFriendRequests } from '../api/friend.api'
import Avatar from './Avatar'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Fetch pending friend requests count dynamically
  const { data: requests = [] } = useQuery({
    queryKey: ['friendRequestsCount'],
    queryFn: getFriendRequests,
    refetchInterval: 10000, // auto refetch request counts every 10s
    enabled: !!user, // only query if user is logged in
  })

  const requestCount = requests.length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="h-[65px] w-full sticky top-0 bg-card/80 backdrop-blur-md border-b border-border/60 z-50 flex items-center justify-between px-6 transition-colors duration-300">
      
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-[32px] h-[32px] rounded-[12px] bg-accent flex items-center justify-center text-white font-bold text-lg shadow-md shadow-accent/20 group-hover:scale-105 transition-transform duration-200">
          S
        </div>
        <span className="font-bold text-lg text-primary tracking-tight hidden sm:block">
          SocialApp
        </span>
      </Link>

      {/* Center: Navigation Links */}
      <div className="flex items-center gap-2">
        <NavLink
          to="/"
          className={({ isActive }) => `
            h-[36px] px-4 rounded-[16px] text-sm font-semibold flex items-center gap-2 transition-all duration-200
            ${isActive 
              ? 'bg-accent-light text-accent' 
              : 'text-secondary hover:bg-base hover:text-primary'
            }
          `}
        >
          <Home size={16} />
          <span className="hidden md:inline">Home</span>
        </NavLink>

        <NavLink
          to="/people"
          className={({ isActive }) => `
            h-[36px] px-4 rounded-[16px] text-sm font-semibold flex items-center gap-2 transition-all duration-200
            ${isActive 
              ? 'bg-accent-light text-accent' 
              : 'text-secondary hover:bg-base hover:text-primary'
            }
          `}
        >
          <Users size={16} />
          <span className="hidden md:inline">People</span>
        </NavLink>

        <NavLink
          to="/requests"
          className={({ isActive }) => `
            h-[36px] px-4 rounded-[16px] text-sm font-semibold flex items-center gap-2 transition-all duration-200 relative
            ${isActive 
              ? 'bg-accent-light text-accent' 
              : 'text-secondary hover:bg-base hover:text-primary'
            }
          `}
        >
          <UserPlus size={16} />
          <span className="hidden md:inline">Requests</span>
          {requestCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-card animate-bounce">
              {requestCount}
            </span>
          )}
        </NavLink>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={(e) => toggleTheme(e)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-input border border-border/80 text-primary hover:bg-base transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} className="text-warning" /> : <Moon size={16} className="text-accent" />}
        </button>

        {/* User Profile Info */}
        {user && (
          <>
            <Link 
              to={`/user/${user._id || user.id}`}
              className="flex items-center gap-2 hover:opacity-85 transition-opacity py-1 px-1.5 rounded-[12px] hover:bg-base"
            >
              <Avatar
                src={user.photo || user.profilePicture}
                firstName={user.firstName}
                lastName={user.lastName}
                size="sm"
              />
              <span className="text-sm font-semibold text-primary hidden sm:inline max-w-[80px] truncate">
                {user.firstName}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer active:scale-95"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>

    </nav>
  )
}

export default Navbar
