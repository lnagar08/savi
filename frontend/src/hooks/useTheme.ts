import { useEffect, useState } from 'react'

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const storedTheme = window.localStorage.getItem('theme')
  if (storedTheme) {
    return storedTheme === 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useTheme = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(getInitialTheme)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    document.body.classList.toggle('dark-theme', isDarkTheme)
    window.localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const syncTheme = () => setIsDarkTheme(document.body.classList.contains('dark-theme'))
    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev)
  }

  const setTheme = (isDark: boolean) => {
    setIsDarkTheme(isDark)
  }

  return {
    isDarkTheme,
    toggleTheme,
    setTheme,
  }
}
