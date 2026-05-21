import React from 'react'

/**
 * Reusable premium input component.
 * Supports React Hook Form registration.
 */
export const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  error,
  placeholder,
  className = '',
  inputClassName = '',
  rightElement,
  ...rest
}, ref) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="text-xs font-semibold text-secondary px-1 tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3
            bg-input text-primary 
            border border-border 
            rounded-[16px] 
            text-sm font-medium
            placeholder:text-muted/60
            transition-all duration-200 ease-in-out
            outline-none
            focus:border-accent focus:ring-2 focus:ring-accent/15
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger/80 focus:border-danger focus:ring-danger/15' : ''}
            ${rightElement ? 'pr-12' : ''}
            ${inputClassName}
          `}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-4 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-danger px-1 animate-fadeIn">
          {error.message || error}
        </span>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
