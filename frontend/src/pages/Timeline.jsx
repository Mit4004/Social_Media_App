import React, { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import CreatePostTrigger from '../components/CreatePostTrigger'
import PostCard from '../components/PostCard'
import SkeletonLoader from '../components/SkeletonLoader'
import { getTimelinePosts } from '../api/post.api'

export const Timeline = () => {
  const createPostRef = useRef(null)

  const { data: posts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['timelinePosts'],
    queryFn: getTimelinePosts,
  })

  const handleCreatePostClick = () => {
    createPostRef.current?.open()
  }

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      {/* Navbar Header */}
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 py-8 flex gap-8 justify-center items-start">
        {/* Left Column: Sidebar (shown on md/lg screens) */}
        <div className="hidden md:block">
          <Sidebar onCreatePost={handleCreatePostClick} />
        </div>

        {/* Center Column: Feed content */}
        <div className="flex-1 max-w-[612px] flex flex-col gap-4">
          <CreatePostTrigger ref={createPostRef} />

          {isLoading ? (
            <div className="space-y-4">
              <SkeletonLoader type="post" count={3} />
            </div>
          ) : error ? (
            <div className="bg-card border border-border p-8 rounded-[16px] text-center shadow-sm">
              <p className="text-danger font-semibold">Failed to load posts. Please try again later.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-[12px] hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card border border-border p-12 rounded-[16px] text-center shadow-sm flex flex-col items-center gap-3 transition-colors duration-300">
              <h3 className="font-bold text-lg text-primary mt-2">Your Timeline is Empty</h3>
              <p className="text-secondary text-sm max-w-xs leading-relaxed">
                Add friends to see their updates here, or write your own first post to start sharing!
              </p>
              <button
                onClick={handleCreatePostClick}
                className="mt-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent/90 transition-all active:scale-95 shadow-md shadow-accent/15 cursor-pointer"
              >
                Create First Post
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleCreatePostClick}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 active:scale-95 transition-transform z-40 cursor-pointer"
        title="Create Post"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}

export default Timeline
