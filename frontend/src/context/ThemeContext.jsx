import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Provides theme context (light/dark mode) and toggle functionality to the app
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  // Sync theme to document element dataset
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Toggles the theme state between light and dark and updates localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to consume the ThemeContext
export const useTheme = () => useContext(ThemeContext)