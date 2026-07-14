import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Image as ImageIcon } from 'lucide-react'
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
  const [selectedFiles, setSelectedFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const fileInputRef = useRef(null)
  const dragCounter = useRef(0)

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => handleCloseModal()
  }))

  const postMutation = useMutation({
    mutationFn: (data) => createPost(data),
    onSuccess: () => {
      toast.success('Post published!')
      setContent('')
      filePreviews.forEach(url => URL.revokeObjectURL(url))
      setSelectedFiles([])
      setFilePreviews([])
      setIsOpen(false)
      setIsDragging(false)
      setShowMediaUpload(false)
      dragCounter.current = 0
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
    filePreviews.forEach(url => URL.revokeObjectURL(url))
    setSelectedFiles([])
    setFilePreviews([])
    setIsDragging(false)
    setShowMediaUpload(false)
    dragCounter.current = 0
  }

  // Handle selected files change and local validations
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    if (selectedFiles.length + files.length > 5) {
      toast.error('You can upload up to 5 files maximum.')
      return
    }

    const newFiles = []
    const newPreviews = []

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`File "${file.name}" is not an allowed image type. Only JPEG, PNG, and WEBP are permitted.`)
        continue
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 50MB size limit.`)
        continue
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setSelectedFiles((prev) => [...prev, ...newFiles])
    setFilePreviews((prev) => [...prev, ...newPreviews])
    setShowMediaUpload(true)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    if (postMutation.isPending) return

    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    if (selectedFiles.length + files.length > 5) {
      toast.error('You can upload up to 5 files maximum.')
      return
    }

    const newFiles = []
    const newPreviews = []

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`File "${file.name}" is not an allowed image type. Only JPEG, PNG, and WEBP are permitted.`)
        continue
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 50MB size limit.`)
        continue
      }
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles])
      setFilePreviews((prev) => [...prev, ...newPreviews])
      setShowMediaUpload(true)
    }
  }

  // Removes a selected file from the preview listing
  const removeFile = (idx) => {
    URL.revokeObjectURL(filePreviews[idx])
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  // Submits the new post content and files to the server using react-query mutation
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim() && selectedFiles.length === 0) {
      toast.warning('Please write something or attach media first.')
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

  if (!user) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          
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
            onClick={(e) => e.stopPropagation()}
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

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col overflow-y-auto relative"
            >
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

              {/* Text area & Previews */}
              <div className="px-6 pb-4 flex-1 min-h-[160px] flex flex-col">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${user.firstName}?`}
                  className="w-full flex-1 min-h-[100px] text-sm text-primary placeholder:text-muted/60 bg-transparent resize-none outline-none border-none py-1"
                  maxLength={1000}
                  disabled={postMutation.isPending}
                />

                {(showMediaUpload || selectedFiles.length > 0) && (
                  <div 
                    onClick={() => {
                      if (selectedFiles.length === 0) {
                        fileInputRef.current?.click()
                      }
                    }}
                    className={`mt-3 border-2 border-dashed rounded-[12px] p-3 flex flex-col items-center justify-center transition-all duration-200 ${
                      selectedFiles.length === 0 ? 'cursor-pointer hover:bg-base/40 border-border hover:border-accent' : 'border-border bg-base/10'
                    }`}
                  >
                    {selectedFiles.length === 0 ? (
                      <div className="flex flex-col items-center py-4 text-center">
                        <ImageIcon size={28} className="text-secondary mb-2" />
                        <span className="text-xs font-bold text-primary">
                          Drag & drop images here, or <span className="text-accent hover:underline">browse</span>
                        </span>
                        <span className="text-[10px] text-secondary mt-1">
                          JPEG, PNG, WEBP up to 50MB (max 5 files)
                        </span>
                      </div>
                    ) : (
                      <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1 scrollbar">
                          {selectedFiles.map((file, idx) => {
                            const url = filePreviews[idx]
                            return (
                              <div key={idx} className="relative aspect-square rounded-[12px] overflow-hidden border border-border bg-card flex items-center justify-center group">
                                <img src={url} alt={file.name} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )
                          })}
                          {selectedFiles.length < 5 && (
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="aspect-square rounded-[12px] border border-dashed border-border hover:border-accent bg-card hover:bg-base flex flex-col items-center justify-center cursor-pointer transition-colors"
                            >
                              <ImageIcon size={18} className="text-secondary mb-1" />
                              <span className="text-[10px] font-bold text-secondary">Add more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Invisible file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />

              {/* Media Toolbar */}
              <div className="px-6 py-3 border-t border-border/40 flex items-center justify-between bg-card/50">
                <span className="text-[11px] font-bold text-secondary">Add to your post</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaUpload(prev => !prev)
                    }}
                    disabled={postMutation.isPending}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      showMediaUpload || selectedFiles.length > 0
                        ? 'text-accent bg-accent/20'
                        : 'text-secondary hover:text-primary hover:bg-base'
                    }`}
                    title="Photo/Video"
                  >
                    <ImageIcon size={15} />
                  </button>
                </div>
              </div>

              {/* Submit */}
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

              {/* Drag overlay visual indicator */}
              {isDragging && (
                <div className="absolute inset-0 z-50 bg-accent/10 border-2 border-dashed border-accent m-4 rounded-[12px] flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
                  <div className="p-4 rounded-full bg-accent/20 text-accent mb-2">
                    <ImageIcon size={32} className="animate-bounce" />
                  </div>
                  <span className="text-sm font-bold text-accent">Drop images here</span>
                  <span className="text-xs text-secondary mt-1">Up to 5 images (JPEG, PNG, WEBP)</span>
                </div>
              )}
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
})

export default CreatePostTrigger
