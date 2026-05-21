import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Image, Video, Smile, X, Plus, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { createPost } from '../api/post.api'
import Avatar from './Avatar'
import Button from './Button'

export const CreatePostTrigger = forwardRef(({ isOpenInitially = false }, ref) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(isOpenInitially)
  const [content, setContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => handleCloseModal()
  }))

  // TanStack Query post creation mutation
  const postMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      toast.success('Post published!')
      // Reset form states
      setContent('')
      setSelectedFiles([])
      setPreviews([])
      setIsOpen(false)
      // Refetch feed list
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Failed to create post.'
      toast.error(errorMsg)
    },
  })

  const handleOpenModal = () => setIsOpen(true)
  const handleCloseModal = () => {
    if (postMutation.isPending) return
    setIsOpen(false)
    setContent('')
    setSelectedFiles([])
    setPreviews([])
  }

  // Handle media selection & previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (selectedFiles.length + files.length > 5) {
      toast.warning('You can upload a maximum of 5 files.')
      return
    }

    const validFiles = []
    const newPreviews = []

    files.forEach((file) => {
      // Validate file size (max 50MB per file)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit.`)
        return
      }

      validFiles.push(file)
      
      const fileType = file.type.startsWith('video/') ? 'video' : 'image'
      const url = URL.createObjectURL(file)
      newPreviews.push({ url, type: fileType, name: file.name })
    })

    setSelectedFiles((prev) => [...prev, ...validFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index) => {
    // Revoke URL to release memory
    URL.revokeObjectURL(previews[index].url)
    
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim() && selectedFiles.length === 0) {
      toast.warning('Please enter some text or select a file.')
      return
    }

    const formData = new FormData()
    formData.append('content', content)
    formData.append('visibility', 'public')
    selectedFiles.forEach((file) => {
      formData.append('files', file)
    })

    postMutation.mutate(formData)
  }

  // Bind a click handler to the file input
  const triggerFileInput = () => {
    fileInputRef.current?.click()
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
              {/* User details */}
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

              {/* Text editor */}
              <div className="px-6 pb-2 flex-1 min-h-[120px]">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${user.firstName}?`}
                  className="w-full h-full min-h-[100px] text-sm text-primary placeholder:text-muted/60 bg-transparent resize-none outline-none border-none py-1"
                  maxLength={1000}
                  disabled={postMutation.isPending}
                />
              </div>

              {/* Previews grid */}
              {previews.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-3 gap-2 border border-border bg-input p-3 rounded-[12px] max-h-[220px] overflow-y-auto scrollbar">
                    {previews.map((preview, idx) => (
                      <div key={idx} className="relative rounded-[8px] overflow-hidden aspect-square border border-border group bg-base">
                        {preview.type === 'video' ? (
                          <video src={preview.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={preview.url} alt="upload preview" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 w-[20px] h-[20px] bg-danger text-white rounded-full flex items-center justify-center opacity-85 hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="rounded-[8px] border border-dashed border-border/80 flex flex-col items-center justify-center aspect-square text-secondary hover:text-primary hover:border-accent hover:bg-base transition-colors"
                      >
                        <Plus size={20} />
                        <span className="text-[10px] mt-1">Add File</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Add to Post Options Bar */}
              <div className="mx-6 mb-4 p-3 border border-border bg-input rounded-[12px] flex items-center justify-between">
                <span className="text-xs font-bold text-secondary px-1">Add to your post</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-success hover:bg-base transition-colors cursor-pointer"
                    title="Attach Image/Video"
                  >
                    <Image size={18} />
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="px-6 pb-6 border-t border-border/40 pt-4 bg-card">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full shadow-lg shadow-accent/10"
                  isLoading={postMutation.isPending}
                  disabled={!content.trim() && selectedFiles.length === 0}
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
