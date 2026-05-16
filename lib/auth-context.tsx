"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import { mockUsers } from "./mock-data"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  hasRole: (roles: UserRole[]) => boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = "library_auth_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User
        // Verify the user still exists in our mock data (or would exist in real DB)
        const validUser = mockUsers.find((u) => u.id === parsedUser.id)
        if (validUser) {
          setUser(validUser)
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error("Error restoring auth state:", error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Mock authentication - in production, this would hit a real API
    const foundUser = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (foundUser && password.length >= 6) {
      setUser(foundUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser))
      setIsLoading(false)
      return { success: true }
    }

    setIsLoading(false)
    return { success: false, error: "Invalid email or password" }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Check if email already exists
    const existingUser = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase())
    if (existingUser) {
      setIsLoading(false)
      return { success: false, error: "Email already registered" }
    }

    // Create new user (in production, this would create in database)
    const newUser: User = {
      id: String(Date.now()),
      email: data.email,
      name: data.name,
      role: "patron",
      membershipId: `PAT${String(Date.now()).slice(-4)}`,
      phone: data.phone,
      address: data.address,
      joinDate: new Date().toISOString().split("T")[0],
      borrowingLimit: 5,
      currentBorrows: 0,
      finesOwed: 0,
      isActive: false,
      approvalStatus: "pending",
    }

    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    setIsLoading(false)
    return { success: true }
  }, [])

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
