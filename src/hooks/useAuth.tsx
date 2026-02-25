import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { authService } from '@/services/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<User>
  register: (data: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session on mount
  useEffect(() => {
    const token = localStorage.getItem('crowdaid_token')
    const cached = localStorage.getItem('crowdaid_user')
    if (token) {
      if (cached) {
        try {
          setUser(JSON.parse(cached))
        } catch {
          localStorage.removeItem('crowdaid_user')
        }
      }
      authService.getMe()
        .then((freshUser) => {
          setUser(freshUser)
          localStorage.setItem('crowdaid_user', JSON.stringify(freshUser))
        })
        .catch(() => {
          localStorage.removeItem('crowdaid_token')
          localStorage.removeItem('crowdaid_refresh_token')
          localStorage.removeItem('crowdaid_user')
          setUser(null)
        })
        .finally(() => setIsLoading(false))
      return
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authService.login(data)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authService.register(data)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(async () => {
    try { await authService.logout() } catch { /* ignore */ }
    localStorage.removeItem('crowdaid_token')
    localStorage.removeItem('crowdaid_refresh_token')
    localStorage.removeItem('crowdaid_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
