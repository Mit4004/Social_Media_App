import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Reusable premium button component.
 * Features hover transformations, focus outline ring, and loading state.
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...rest
}) => {
  // Styles for different variants
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-[16px] transition-all duration-200 ease-in-out outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25 focus:ring-accent/40',
    secondary: 'bg-card text-primary border border-border hover:bg-base hover:shadow-md focus:ring-primary/20',
    success: 'bg-success text-white hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 focus:ring-success/40',
    danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-lg hover:shadow-danger/25 focus:ring-danger/40',
    dangerOutline: 'bg-transparent text-danger border border-danger hover:bg-danger/5 active:scale-95 focus:ring-danger/20',
    text: 'bg-transparent text-primary hover:bg-base focus:ring-primary/10',
  }

  const sizes = {
    sm: 'px-3.5 py-2 text-xs font-semibold rounded-[12px]',
    md: 'px-5 py-3 text-sm font-semibold',
    lg: 'px-7 py-4 text-base font-bold',
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyle} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${className}
      `}
      {...rest}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-current" />
          <span>Please wait...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
