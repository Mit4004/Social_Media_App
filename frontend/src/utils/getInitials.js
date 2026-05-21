/**
 * Generates uppercase initials for a user's name.
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} - Two-character capitalized initials (e.g. "JD")
 */
export const getInitials = (firstName, lastName) => {
  const first = (firstName || '').trim().charAt(0).toUpperCase()
  const last = (lastName || '').trim().charAt(0).toUpperCase()
  
  if (first && last) {
    return `${first}${last}`
  }
  
  return first || last || '?'
}

export default getInitials
