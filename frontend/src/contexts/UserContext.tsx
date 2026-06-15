import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import apiClient from '../services/api'

interface UserRecord {
  id: number
  name: string
  email: string
  provider: string | null
  createdAt: string
  updatedAt: string
}

interface UserContextValue {
  user: UserRecord | null
  displayName: string
  initials: string
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

const getInitials = (displayName: string) => {
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return 'U'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/auth/me')
      const payload = response?.data?.data?.user as UserRecord | undefined
      setUser(payload || null)
    } catch {
      setUser(null)
      console.log('dfkkj')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const displayName = user?.name.trim() || 'User'
  const initials = getInitials(displayName)

  const value = useMemo(
    () => ({ user, displayName, initials, isLoading, refreshUser }),
    [user, displayName, initials, isLoading, refreshUser]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
