import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, Trash2, Send, CornerDownRight } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { deletePost, likePost, unlikePost } from '../api/post.api'
import { getComments, createComment, deleteComment } from '../api/comment.api'
import Avatar from './Avatar'
import formatDate from '../utils/formatDate'
import Button from './Button'

export const PostCard = ({ post }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  // Check if post belongs to the logged-in user
  const postAuthorId = post.user?._id || post.user
  const isOwnPost = postAuthorId === user?._id

  // Load liked status from localStorage to persist liked state during refreshing
  const [isLiked, setIsLiked] = useState(() => {
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    return liked.includes(post._id)
  })
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)

  // Fetch comments query (active only when comment section is toggled open)
  const { data: commentsResponse, refetch: refetchComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['postComments', post._id],
    queryFn: () => getComments(post._id),
    enabled: showComments,
  })

  const comments = commentsResponse?.comments || []

  // Resolve media asset absolute URL
  const getMediaUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`
  }

  // Like Mutation
  const likeMutation = useMutation({
    mutationFn: () => likePost(post._id),
    onError: () => {
      // rollback state
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      toast.error('Could not like post')
    },
  })

  // Unlike Mutation
  const unlikeMutation = useMutation({
    mutationFn: () => unlikePost(post._id),
    onError: () => {
      // rollback state
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      toast.error('Could not unlike post')
    },
  })

  const handleLikeToggle = () => {
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]')
    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      unlikeMutation.mutate()
      const updated = liked.filter((id) => id !== post._id)
      localStorage.setItem('liked_posts', JSON.stringify(updated))
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      likeMutation.mutate()
      liked.push(post._id)
      localStorage.setItem('liked_posts', JSON.stringify(liked))
    }
  }

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(post._id),
    onSuccess: () => {
      toast.success('Post deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete post.')
    },
  })

  const handleDeletePost = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate()
    }
  }

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: (text) => createComment(post._id, { text }),
    onSuccess: () => {
      setCommentText('')
      refetchComments()
      // Invalidate timeline so main feed commentsCount updates
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post comment.')
    },
  })

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    addCommentMutation.mutate(commentText)
  }

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      toast.success('Comment deleted.')
      refetchComments()
      // Invalidate timeline so main feed commentsCount updates
      queryClient.invalidateQueries({ queryKey: ['timelinePosts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete comment.')
    },
  })

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Delete this comment?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

  // Render media attachments grid
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null

    const gridClasses = post.media.length === 1 
      ? 'grid-cols-1' 
      : post.media.length === 2 
        ? 'grid-cols-2' 
        : 'grid-cols-2 sm:grid-cols-3'

    return (
      <div className={`grid gap-2 mt-4 rounded-[16px] overflow-hidden border border-border/30 bg-base ${gridClasses}`}>
        {post.media.map((file, idx) => {
          const mediaUrl = getMediaUrl(file.url)
          return (
            <div key={idx} className="relative aspect-video flex items-center justify-center overflow-hidden bg-black/5">
              {file.fileType === 'video' ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-full object-cover max-h-[350px]"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={`Post attachment ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-102 transition-transform duration-300 max-h-[350px]"
                  loading="lazy"
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <article className="w-full max-w-[612px] bg-card border border-border rounded-[16px] p-5 shadow-sm mb-4 transition-colors duration-300 flex flex-col">
      
      {/* Header: User Info & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/user/${postAuthorId}`}>
            <Avatar
              src={post.user?.profilePhoto || post.user?.photo}
              firstName={post.user?.firstName}
              lastName={post.user?.lastName}
              size="sm"
            />
          </Link>
          <div className="flex flex-col">
            <Link 
              to={`/user/${postAuthorId}`}
              className="text-sm font-bold text-primary hover:text-accent hover:underline transition-colors"
            >
              {post.user?.firstName} {post.user?.lastName}
            </Link>
            <span className="text-[11px] text-muted font-medium">
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Delete Post Button (own posts only) */}
        {isOwnPost && (
          <button
            onClick={handleDeletePost}
            disabled={deletePostMutation.isPending}
            className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-secondary hover:text-danger hover:bg-danger/10 transition-all cursor-pointer active:scale-95"
            title="Delete Post"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Body: Text and Media Content */}
      <p className="mt-4 text-[14px] text-primary leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>
      
      {renderMedia()}

      {/* Footer Action Bar */}
      <div className="border-t border-border/50 mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-secondary">
        {/* Like Button */}
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 hover:bg-base py-2 px-4 rounded-[12px] transition-colors cursor-pointer ${
            isLiked ? 'text-accent' : 'hover:text-primary'
          }`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
        </button>

        {/* Comment Toggle Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 hover:bg-base py-2 px-4 rounded-[12px] transition-colors cursor-pointer ${
            showComments ? 'text-accent bg-base/50' : 'hover:text-primary'
          }`}
        >
          <MessageCircle size={16} />
          <span>{post.commentsCount || 0} {post.commentsCount === 1 ? 'Comment' : 'Comments'}</span>
        </button>

        {/* Share Button (placeholder action) */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + `/user/${postAuthorId}`)
            toast.info('Author profile link copied to clipboard!')
          }}
          className="flex items-center gap-2 hover:bg-base py-2 px-4 rounded-[12px] transition-colors cursor-pointer hover:text-primary"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {/* Nested Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
          
          {/* Add Comment Input Form */}
          <form onSubmit={handleAddComment} className="flex gap-2.5 items-center">
            <Avatar
              src={user?.photo || user?.profilePicture}
              firstName={user?.firstName}
              lastName={user?.lastName}
              size="sm"
            />
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                disabled={addCommentMutation.isPending}
                className="w-full bg-input text-primary border border-border rounded-full py-2 pl-4 pr-10 text-xs focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 placeholder:text-muted/60"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="absolute right-2 text-accent hover:text-accent/80 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={14} />
              </button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="flex justify-center py-2">
              <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-xs text-muted py-2">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 scrollbar">
              {comments.map((comment) => {
                const commentAuthorId = comment.user?._id || comment.user
                const isOwnComment = commentAuthorId === user?._id

                return (
                  <div key={comment._id} className="flex items-start gap-2.5 text-xs group">
                    <Link to={`/user/${commentAuthorId}`}>
                      <Avatar
                        src={comment.user?.profilePhoto || comment.user?.photo}
                        firstName={comment.user?.firstName}
                        lastName={comment.user?.lastName}
                        size="sm"
                      />
                    </Link>
                    <div className="flex-1 bg-input border border-border p-3 rounded-[16px] relative">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/user/${commentAuthorId}`}
                          className="font-bold text-primary hover:underline hover:text-accent"
                        >
                          {comment.user?.firstName} {comment.user?.lastName}
                        </Link>
                        <span className="text-[10px] text-muted font-medium">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-primary leading-normal whitespace-pre-wrap">
                        {comment.text}
                      </p>

                      {/* Delete Comment Button (own comment only) */}
                      {isOwnComment && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="absolute right-3 top-3 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

    </article>
  )
}

export default PostCard
