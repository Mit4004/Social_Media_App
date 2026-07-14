import React, { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import RightPanel from '../components/RightPanel'
import CreatePostTrigger from '../components/CreatePostTrigger'
import PostCard from '../components/PostCard'
import AnimatedPostList from '../components/AnimatedPostList'
import SkeletonLoader from '../components/SkeletonLoader'
import { getTimelinePosts } from '../api/post.api'

// Timeline page component that renders the main feed showing posts from friends and user triggers
export const Timeline = () => {
  const createPostRef = useRef(null)

  const { data: posts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['timelinePosts'],
    queryFn: getTimelinePosts,
  })

  // Opens the CreatePost modal dialog using imperative ref handle
  const handleCreatePostClick = () => {
    createPostRef.current?.open()
  }

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <Navbar />

      <div className="flex pl-0 md:pl-[72px]">
        {/* Left: Slim Icon Sidebar */}
        <div className="hidden md:flex">
          <Sidebar onCreatePost={handleCreatePostClick} />
        </div>

        {/* Center + Right wrapper */}
        <div className="flex-1 flex justify-center px-4 py-6 w-full">

          {/* Left spacer column to balance RightPanel and keep timeline centered */}
          <div className="hidden xl:block w-[280px] flex-shrink-0" />

          {/* Center: Feed */}
          <div className="flex-1 max-w-[500px] mx-auto flex flex-col gap-4">
            <CreatePostTrigger ref={createPostRef} />

            {isLoading ? (
              <div className="space-y-4">
                <SkeletonLoader type="post" count={3} />
              </div>
            ) : error ? (
              <div className="bg-card border border-border p-8 rounded-[16px] text-center shadow-sm">
                <p className="text-danger font-semibold text-sm">Failed to load posts.</p>
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
                  Add friends to see their updates here, or write your own first post!
                </p>
                <button
                  onClick={handleCreatePostClick}
                  className="mt-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent/90 transition-all active:scale-95 shadow-md shadow-accent/15 cursor-pointer"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <AnimatedPostList posts={posts} />
            )}
          </div>

          {/* Right: Suggestions Panel */}
          <div className="hidden xl:flex w-[280px] flex-shrink-0">
            <RightPanel />
          </div>

        </div>

      </div>

      {/* Mobile FAB */}
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
