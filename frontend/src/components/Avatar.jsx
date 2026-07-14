import React, { useState, useEffect } from 'react'
import getInitials from '../utils/getInitials'

/**
 * Reusable premium Avatar component.
 * Displays profile image or initials with generated HSL color.
 */
export const Avatar = ({
  src,
  firstName = '',
  lastName = '',
  size = 'sm', // 'sm' (32px), 'md' (48px), 'lg' (56px), 'xl' (96px)
  className = '',
}) => {
  const [imageError, setImageError] = useState(false)

  // Reset image error if src changes
  useEffect(() => { 
    setImageError(false)
  }, [src])

  // Map size classes
  const sizeClasses = {
    sm: 'w-[32px] h-[32px] text-xs',
    md: 'w-[48px] h-[48px] text-sm',
    lg: 'w-[56px] h-[56px] text-base',
    xl: 'w-[96px] h-[96px] text-2xl font-bold',
  }

  // Prepends server address if path is relative
  // Prepends the API base URL to a relative image path
  const getFullImageUrl = (path) => {
    if (!path) return null
    
    let url = path
    if (typeof path === 'object' && path !== null) {
      url = path.url || ''
    }

    if (!url || typeof url !== 'string') return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const baseUrl = import.meta.env.VITE_API_URL || ''
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const imageUrl = getFullImageUrl(src)
  const fullName = `${firstName} ${lastName}`.trim() || 'User'
  const initials = getInitials(firstName, lastName)

  // Generate a deterministic HSL color based on the user's name
  // Generates a deterministic HSL color code based on the user's name
  const getBackgroundColor = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    // Limit hue between 0 and 360, saturation 65%, lightness 45% (vibrant but dark enough for white text)
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 65%, 45%)`
  }

  const fallbackBgColor = getBackgroundColor(fullName)

  return (
    <div
      className={`
        relative rounded-full overflow-hidden flex items-center justify-center 
        font-semibold select-none flex-shrink-0 border border-border/20
        ${sizeClasses[size]} 
        ${className}
      `}
      style={{
        backgroundColor: !imageUrl || imageError ? fallbackBgColor : undefined,
        color: !imageUrl || imageError ? '#FFFFFF' : undefined,
      }}
    >
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={fullName}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export default Avatar
