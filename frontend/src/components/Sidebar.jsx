import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Home, Users, UserPlus, Plus, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from './Avatar'

export const Sidebar = ({ onCreatePost }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (!user) return null

  const profileUrl = `/user/${user._id || user.id}`

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: <Home size={22} />, label: 'Home' },
    { to: '/people', icon: <Users size={22} />, label: 'People' },
    { to: '/requests', icon: <UserPlus size={22} />, label: 'Requests' },
  ]

  return (
    <aside className="w-[72px] flex-shrink-0 fixed left-0 top-[60px] h-[calc(100vh-60px)] flex flex-col items-center py-4 gap-1 border-r border-border bg-card transition-colors duration-300 z-40">

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          end={item.to === '/'}
          className={({ isActive }) => `
            w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-200
            ${isActive
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'text-secondary hover:bg-base hover:text-primary'
            }
          `}
        >
          {item.icon}
        </NavLink>
      ))}

      {onCreatePost && (
        <button
          onClick={onCreatePost}
          title="Create Post"
          className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-accent-light text-accent hover:bg-accent hover:text-white transition-all duration-200 mt-1 cursor-pointer active:scale-95"
        >
          <Plus size={22} />
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={toggleTheme}
        title="Toggle Theme"
        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-secondary hover:bg-base hover:text-primary transition-all duration-200 cursor-pointer"
      >
        {theme === 'dark' ? <Sun size={20} className="text-warning" /> : <Moon size={20} />}
      </button>

      <Link
        to={profileUrl}
        title="My Profile"
        className="w-12 h-12 rounded-[14px] flex items-center justify-center hover:bg-base transition-all duration-200"
      >
        <Avatar
          src={user.photo || user.profilePicture}
          firstName={user.firstName}
          lastName={user.lastName}
          size="sm"
        />
      </Link>

      <button
        onClick={handleLogout}
        title="Sign Out"
        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-all duration-200 cursor-pointer"
      >
        <LogOut size={20} />
      </button>

    </aside>
  )
}

export default Sidebar
