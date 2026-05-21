import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Home, Users, UserPlus, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import Button from './Button'

export const Sidebar = ({ onCreatePost }) => {
  const { user } = useAuth()

  if (!user) return null

  const profileUrl = `/user/${user._id || user.id}`

  return (
    <aside className="w-[240px] flex-shrink-0 sticky top-[89px] h-fit">
      
      {/* Profile Card Container */}
      <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm flex flex-col items-center text-center transition-colors duration-300">
        
        {/* User Avatar */}
        <Link to={profileUrl} className="hover:scale-102 transition-transform duration-200">
          <Avatar
            src={user.photo || user.profilePicture}
            firstName={user.firstName}
            lastName={user.lastName}
            size="md"
            className="ring-4 ring-accent/5"
          />
        </Link>

        {/* User Name & Bio */}
        <Link 
          to={profileUrl}
          className="mt-3.5 text-base font-bold text-primary hover:text-accent hover:underline transition-colors"
        >
          {user.firstName} {user.lastName}
        </Link>
        
        <p className="mt-1.5 text-xs text-secondary line-clamp-2 px-1">
          {user.bio || "No bio added yet. Tell people about yourself!"}
        </p>

        {/* Navigation Menu Links */}
        <div className="w-full mt-6 pt-5 border-t border-border flex flex-col gap-1 text-left">
          <NavLink
            to="/"
            className={({ isActive }) => `
              px-4 py-2.5 rounded-[12px] text-sm font-semibold flex items-center gap-3 transition-colors
              ${isActive 
                ? 'bg-accent-light text-accent' 
                : 'text-secondary hover:bg-base hover:text-primary'
              }
            `}
          >
            <Home size={16} />
            Timeline
          </NavLink>

          <NavLink
            to="/people"
            className={({ isActive }) => `
              px-4 py-2.5 rounded-[12px] text-sm font-semibold flex items-center gap-3 transition-colors
              ${isActive 
                ? 'bg-accent-light text-accent' 
                : 'text-secondary hover:bg-base hover:text-primary'
              }
            `}
          >
            <Users size={16} />
            People
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) => `
              px-4 py-2.5 rounded-[12px] text-sm font-semibold flex items-center gap-3 transition-colors
              ${isActive 
                ? 'bg-accent-light text-accent' 
                : 'text-secondary hover:bg-base hover:text-primary'
              }
            `}
          >
            <UserPlus size={16} />
            Friend Requests
          </NavLink>
        </div>

        {/* Bottom "Create Post" Button */}
        {onCreatePost && (
          <Button
            variant="primary"
            size="md"
            onClick={onCreatePost}
            className="w-full mt-6 shadow-md shadow-accent/15 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Create Post
          </Button>
        )}

      </div>

    </aside>
  )
}

export default Sidebar
