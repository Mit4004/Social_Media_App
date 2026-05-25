import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import PostCard from './PostCard'
import './AnimatedPostList.css'

// Wrapper component that animates individual post items when they come into view
const AnimatedPostItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.15, once: false })
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      className="animated-post-item-wrapper"
    >
      {children}
    </motion.div>
  )
}

// Renders a list of posts with scroll-aware indicators, highlighting, and optional keyboard navigation
export const AnimatedPostList = ({
  posts = [],
  showGradients = true,
  enableArrowNavigation = true,
  className = '',
  displayScrollbar = true,
  initialSelectedIndex = -1,
  showDeleteOption = false
}) => {
  const listRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex)
  const [keyboardNav, setKeyboardNav] = useState(false)
  const [topGradientOpacity, setTopGradientOpacity] = useState(0)
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1)

  // Updates the selected post index on mouse enter
  const handleItemMouseEnter = useCallback((index) => {
    setSelectedIndex(index)
  }, [])

  // Adjusts the top/bottom gradients opacity based on current scroll position
  const handleScroll = useCallback((e) => {
    const target = e.target
    const { scrollTop, scrollHeight, clientHeight } = target
    setTopGradientOpacity(Math.min(scrollTop / 50, 1))
    const bottomDistance = scrollHeight - (scrollTop + clientHeight)
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1))
  }, [])

  // Reset selection index when posts count changes
  useEffect(() => {
    setSelectedIndex(initialSelectedIndex)
  }, [posts, initialSelectedIndex])

  useEffect(() => {
    if (!enableArrowNavigation || posts.length === 0) return
    const handleKeyDown = (e) => {
      // Don't intercept arrow keys if the user is typing in a form input or comment box
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setKeyboardNav(true)
        setSelectedIndex((prev) => Math.min(prev + 1, posts.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setKeyboardNav(true)
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [posts, selectedIndex, enableArrowNavigation])

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return
    const container = listRef.current
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`)
    if (selectedItem) {
      const extraMargin = 50
      const containerScrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      const itemTop = selectedItem.offsetTop
      const itemBottom = itemTop + selectedItem.offsetHeight
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' })
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth'
        })
      }
    }
    setKeyboardNav(false)
  }, [selectedIndex, keyboardNav])

  return (
    <div className={`scroll-post-list-container ${className}`}>
      <div 
        ref={listRef} 
        className={`scroll-post-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} 
        onScroll={handleScroll}
      >
        {posts.map((post, index) => (
          <AnimatedPostItem
            key={post._id}
            delay={0.05}
            index={index}
          >
            <div className={`post-item-card-wrapper ${selectedIndex === index ? 'selected-highlight' : ''}`}>
              <PostCard post={post} showDeleteOption={showDeleteOption} />
            </div>
          </AnimatedPostItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className="scroll-top-gradient" style={{ opacity: topGradientOpacity }}></div>
          <div className="scroll-bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
        </>
      )}
    </div>
  )
}

export default AnimatedPostList
