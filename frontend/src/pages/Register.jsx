import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { registerUser } from '../api/auth.api'
import Input from '../components/Input'
import Button from '../components/Button'
  
// Register page component that allows users to create a new profile with their personal details and password
export const Register = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      password: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success('Registration successful! Please sign in.')
      navigate('/login')
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Registration failed. Email might already be registered.'
      toast.error(errorMsg)
    },
  })

  // Handles form submission to trigger registration API call
  const onSubmit = (data) => {
    registerMutation.mutate(data)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base text-primary relative overflow-hidden px-4 py-12 transition-colors duration-300">
      
      {/* Floating Theme Toggle (top right) */}
      <div className="absolute top-6 right-6">
        <button
          onClick={(e) => toggleTheme(e)}
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center bg-card border border-border hover:bg-base text-primary transition-all duration-200 cursor-pointer active:scale-95 shadow-md"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-accent" />}
        </button>
      </div>

      {/* Background Decorative Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      {/* Register Card */}
      <div className="w-full max-w-[460px] bg-card border border-border rounded-[16px] p-8 shadow-xl relative z-10 transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Logo */}
          <div className="w-[48px] h-[48px] rounded-[12px] bg-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-accent/20 mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Create Account
          </h1>
          <p className="text-sm text-secondary mt-1">
            Join <span className="font-semibold text-accent">SocialApp</span> to share and connect with others
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              placeholder="John"
              error={errors.firstName}
              {...register('firstName', {
                required: 'First name is required',
                validate: (value) => value.trim() !== '' || 'First name cannot be blank',
              })}
            />
            <Input
              label="Last Name"
              type="text"
              placeholder="Doe"
              error={errors.lastName}
              {...register('lastName', {
                required: 'Last name is required',
                validate: (value) => value.trim() !== '' || 'Last name cannot be blank',
              })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            error={errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            label="Mobile Number"
            type="tel"
            placeholder="1234567890"
            error={errors.mobile}
            {...register('mobile', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9+() -]{7,15}$/,
                message: 'Invalid mobile number (must be 7-15 digits)',
              },
            })}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-secondary focus:outline-none cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={registerMutation.isPending}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        {/* Footer / Redirect */}
        <div className="mt-6 text-center text-sm border-t border-border pt-4">
          <p className="text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-accent hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Register
