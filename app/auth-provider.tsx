"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"

type AuthContextType = {
  isLoggedIn: boolean
  setIsLoggedIn: (isLoggedIn: boolean) => void
  userRole: string
  setUserRole: (userRole: string) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check local storage for login status and user role on component mount
    const storedIsLoggedIn = storage.getItem("isLoggedIn")
    const storedUserRole = storage.getItem("userRole")

    if (storedIsLoggedIn) {
      setIsLoggedIn(storedIsLoggedIn)
    }

    if (storedUserRole) {
      setUserRole(storedUserRole)
    }

    // Check local storage for theme
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev
      if (newTheme) {
        localStorage.setItem("theme", "dark")
        document.documentElement.classList.add("dark")
      } else {
        localStorage.setItem("theme", "light")
        document.documentElement.classList.remove("dark")
      }
      return newTheme
    })
  }

  const hasPermission = useCallback(
    (permission: string) => {
      if (userRole === "doctor") {
        return true // Doctors have all permissions
      }

      // Reception role-based permissions
      if (userRole === "reception") {
        const receptionPermissions = ["pacientes", "citas"]
        return receptionPermissions.includes(permission)
      }

      return false // Default: no permission
    },
    [userRole],
  )

  const value: AuthContextType = {
    isLoggedIn,
    setIsLoggedIn,
    userRole,
    setUserRole,
    isDarkMode,
    toggleDarkMode,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider")
  }
  return context
}
