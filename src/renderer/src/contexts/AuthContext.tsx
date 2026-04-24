import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import type { AuthenticatedUser } from '@shared/types'

interface AuthContextValue {
  user: AuthenticatedUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.auth
      .currentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (username, password) => {
        const u = await window.api.auth.login(username, password)
        setUser(u)
      },
      logout: async () => {
        await window.api.auth.logout()
        setUser(null)
      }
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
