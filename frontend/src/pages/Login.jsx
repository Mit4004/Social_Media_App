import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Eye, EyeOff, Sun, Moon, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { loginUser } from '../api/auth.api'
import Input from '../components/Input'
import Button from '../components/Button'

// Login page component that allows users to sign in using their email and password
export const Login = () => {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  // Determine where to redirect after login (default is the homepage `/`)
  const from = location.state?.from?.pathname || '/'

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // TanStack Query login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // data contains { token, user }
      login(data.user, data.token)
      toast.success(`Welcome back, ${data.user.firstName}!`)
      navigate(from, { replace: true })
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.'
      toast.error(errorMsg)
    },
  })

  // Handles form submit to trigger login mutation with credentials
  const onSubmit = (data) => {
    loginMutation.mutate(data)
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

      {/* Login Card */}
      <div className="w-full max-w-[420px] bg-card border border-border rounded-[16px] p-8 shadow-xl relative z-10 transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Logo */}
          <div className="w-[48px] h-[48px] rounded-[12px] bg-accent flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-accent/20 mb-4 animate-pulse">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Sign In
          </h1>
          <p className="text-sm text-secondary mt-1">
            Connect with classmates and friends on <span className="font-semibold text-accent">SocialApp</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-secondary">
              <input 
                type="checkbox" 
                className="rounded-[4px] border-border text-accent focus:ring-accent/30 bg-input"
              />
              Remember me
            </label>
            <a href="#" className="font-semibold text-accent hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={loginMutation.isPending}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer / Redirect */}
        <div className="mt-8 text-center text-sm border-t border-border pt-6">
          <p className="text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-accent hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login
