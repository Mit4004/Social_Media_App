/**
 * Formats a date string or object into a relative string (e.g., "5m ago", "2 hours ago")
 * or a readable calendar date (e.g., "May 21, 2026") for older posts.
 * 
 * @param {string|Date} dateVal - Date representation from database
 * @returns {string} - Formatted relative/absolute date
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return ''

  const date = new Date(dateVal)
  const now = new Date()
  const diffMs = now - date

  // If date is in the future or invalid, return a default string
  if (isNaN(date.getTime()) || diffMs < 0) {
    return 'Just now'
  }

  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) {
    return 'Just now'
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  // Fallback to absolute date: "Month Day, Year"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default formatDate
