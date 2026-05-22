import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { createPost } from '../api/post.api'
import Avatar from './Avatar'
import Button from './Button'

// Component providing a modal dialog to write and publish a new post
export const CreatePostTrigger = forwardRef(({ isOpenInitially = false }, ref) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(isOpenInitially)
  const [content, setContent] = useState('')

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => handleCloseModal()
  }))

  const postMutation = useMutation({
    mutationFn: (data) => createPost(data),
    onSuccess: () => {
      toast.success('Post published!')
      setContent('')
      setIsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post.')
    },
  })

  // Clears post input states and closes the modal dialog
  const handleCloseModal = () => {
    if (postMutation.isPending) return
    setIsOpen(false)
    setContent('')
  }

  // Submits the new post content to the server using react-query mutation
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.warning('Please write something first.')
      return
    }
    const formData = new FormData()
    formData.append('content', content)
    formData.append('visibility', 'public')
    postMutation.mutate(formData)
  }

  if (!user) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            className="absolute inset-0 bg-base/80 backdrop-blur-sm"
          />

          {/* Modal Card Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-[520px] bg-card border border-border rounded-[16px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="h-[60px] px-6 border-b border-border flex items-center justify-between">
              <span className="font-bold text-primary text-base">Create Post</span>
              <button
                onClick={handleCloseModal}
                disabled={postMutation.isPending}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-base transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-y-auto">
              {/* User info */}
              <div className="px-6 py-4 flex items-center gap-3">
                <Avatar
                  src={user.photo || user.profilePicture}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="md"
                />
                <div>
                  <span className="font-bold text-primary text-sm block">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-xs text-secondary bg-base px-2 py-0.5 rounded-full font-medium">
                    Public
                  </span>
                </div>
              </div>

              {/* Text area */}
              <div className="px-6 pb-4 flex-1 min-h-[140px]">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${user.firstName}?`}
                  className="w-full h-full min-h-[120px] text-sm text-primary placeholder:text-muted/60 bg-transparent resize-none outline-none border-none py-1"
                  maxLength={1000}
                  disabled={postMutation.isPending}
                />
              </div>

              {/* Submit */}
              <div className="px-6 pb-6 border-t border-border/40 pt-4 bg-card">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full shadow-lg shadow-accent/10"
                  isLoading={postMutation.isPending}
                  disabled={!content.trim()}
                >
                  Post
                </Button>
              </div>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

export default CreatePostTrigger
