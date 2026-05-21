import React from 'react'

/**
 * Pulse Skeleton Loader to display while data is loading.
 * Supports multiple pre-built mock styles: 'post', 'sidebar', 'list', 'generic'.
 */
export const SkeletonLoader = ({
  type = 'generic', // 'post' | 'sidebar' | 'list' | 'generic'
  count = 1,
  className = '',
}) => {
  const renders = Array.from({ length: count })

  const PostSkeleton = () => (
    <div className="w-full bg-card border border-border rounded-[16px] p-6 space-y-4 mb-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-[40px] h-[40px] rounded-full bg-border/40" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 rounded bg-border/40" />
          <div className="h-3 w-1/6 rounded bg-border/40" />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2 pt-2">
        <div className="h-4.5 w-full rounded bg-border/40" />
        <div className="h-4.5 w-5/6 rounded bg-border/40" />
        <div className="h-4.5 w-2/3 rounded bg-border/40" />
      </div>
      {/* Action Bar */}
      <div className="border-t border-border pt-4 mt-2 flex justify-between">
        <div className="h-4 w-16 rounded bg-border/40" />
        <div className="h-4 w-16 rounded bg-border/40" />
        <div className="h-4 w-16 rounded bg-border/40" />
      </div>
    </div>
  )

  const SidebarSkeleton = () => (
    <div className="w-[240px] bg-card border border-border rounded-[16px] p-6 space-y-6 animate-pulse">
      {/* User Info */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-[48px] h-[48px] rounded-full bg-border/40" />
        <div className="h-4 w-2/3 rounded bg-border/40" />
        <div className="h-3 w-1/2 rounded bg-border/40" />
      </div>
      {/* Navigation Links */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="h-5 w-full rounded bg-border/40" />
        <div className="h-5 w-5/6 rounded bg-border/40" />
        <div className="h-5 w-4/5 rounded bg-border/40" />
      </div>
    </div>
  )

  const ListSkeleton = () => (
    <div className="w-full bg-card border border-border rounded-[16px] divide-y divide-border animate-pulse">
      {renders.map((_, idx) => (
        <div key={idx} className="h-[75px] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-border/40" />
            <div className="w-[40px] h-[40px] rounded-full bg-border/40" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-border/40" />
              <div className="h-3 w-20 rounded bg-border/40" />
            </div>
          </div>
          <div className="h-4 w-24 rounded bg-border/40 hidden md:block" />
          <div className="h-4 w-20 rounded bg-border/40 hidden sm:block" />
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-[12px] bg-border/40" />
            <div className="w-8 h-8 rounded-[12px] bg-border/40" />
          </div>
        </div>
      ))}
    </div>
  )

  if (type === 'post') {
    return <>{renders.map((_, idx) => <PostSkeleton key={idx} />)}</>
  }

  if (type === 'sidebar') {
    return <SidebarSkeleton />
  }

  if (type === 'list') {
    return <ListSkeleton />
  }

  return (
    <div className={`animate-pulse bg-border/40 rounded ${className}`} />
  )
}

export default SkeletonLoader
