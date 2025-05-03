"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { storage } from "@/lib/storage"
import { PageTransition } from "@/components/page-transition"

interface AuthContextProps {
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
  userRole: string | null
  isDarkMode: boolean
  toggleDarkMode: () => void
  hasPermission: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [userPermissions, setUserPermissions] = useState<any>({})
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Obtener permisos actualizados desde la API
  const fetchUserPermissions = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`)
      if (res.ok) {
        const data = await res.json()
        // Log temporal para depuración
        // eslint-disable-next-line no-console
        console.log("[AuthProvider] fetchUserPermissions id:", id)
        // eslint-disable-next-line no-console
        console.log("[AuthProvider] respuesta API /api/usuarios/[id]:", data)
        setUserPermissions(data.permissions || {})
        setUserRole(data.role)
        setUserId(data.id)
      } else {
        // eslint-disable-next-line no-console
        console.log("[AuthProvider] Error en fetch /api/usuarios/" + id, res.status)
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[AuthProvider] Error en fetchUserPermissions", e)
    }
  }, [])

  // Al iniciar sesión o cambiar usuario, obtener permisos desde la API
  useEffect(() => {
    const isAuthenticated = storage.getItem("isLoggedIn")
    const storedUserRole = storage.getItem("userRole")
    const storedUserId = storage.getItem("currentUserId")
    setIsLoggedIn(!!isAuthenticated)
    setUserRole(storedUserRole)
    setUserId(storedUserId ? Number(storedUserId) : null)
  
    if (isAuthenticated && storedUserId) {
      fetchUserPermissions(Number(storedUserId))
    }
  }, [fetchUserPermissions])

  // hasPermission revisa los permisos actuales
  const hasPermission = useCallback(
    (resource: string) => {
      if (!isLoggedIn) return false
      if (userRole === "doctor") return true
      return !!userPermissions[resource]
    },
    [isLoggedIn, userRole, userPermissions]
  )

  // Inicializar usuarios por defecto si no existen
  const initializeDefaultUsers = () => {
    const users = storage.getItem("users") || []

    if (users.length === 0) {
      const defaultUsers = [
        {
          id: 1,
          name: "Emmanuel",
          username: "admin",
          email: "emmanuel@gmail.com",
          role: "doctor",
          permissions: {
            pacientes: true,
            citas: true,
            odontograma: true,
            radiografias: true,
            usuarios: true,
            configuracion: true,
            clinic: true,
          },
        },
        {
          id: 2,
          name: "Marcela",
          username: "marcela",
          email: "secretaria@gmail.com",
          role: "secretary",
          permissions: {
            pacientes: true,
            citas: true,
            odontograma: false,
            radiografias: false,
            usuarios: false,
            configuracion: true,
            clinic: false,
          },
        },
      ]
      storage.setItem("users", defaultUsers)
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      // Inicializar usuarios por defecto SOLO si no existen (solo para desarrollo/local, no para permisos)
      initializeDefaultUsers()

      const isAuthenticated = storage.getItem("isLoggedIn")
      const storedUserRole = storage.getItem("userRole")
      const storedUserId = storage.getItem("currentUserId")
      const darkMode = storage.getItem("darkMode")

      setIsLoggedIn(!!isAuthenticated)
      setUserRole(storedUserRole)
      setIsDarkMode(!!darkMode)
      setUserId(storedUserId ? Number(storedUserId) : null)

      if (!!darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && storedUserRole && storedUserId) {
        // Verificar permisos para la página actual usando userPermissions del estado
        const pathSegments = pathname.split("/").filter(Boolean)
        const currentPage = pathSegments.length > 0 ? pathSegments[0] : ""

        // Usar los permisos del estado (obtenidos de la API)
        if (currentPage && currentPage !== "login" && userPermissions) {
          const hasAccess =
            currentPage === "configuracion"
              ? userPermissions.configuracion
              : userPermissions[currentPage] || false

          if (!hasAccess && currentPage !== "") {
            router.push("/")
          }
        }
      }
    }

    checkAuth()
    // Solo depende de pathname, router, userPermissions
  }, [pathname, router, userPermissions])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev
      storage.setItem("darkMode", newValue)

      if (newValue) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      return newValue
    })
  }

  // Handle page transitions
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => {
      setTimeout(() => setIsLoading(false), 1000)
    }

    // Si ya tienes eventos personalizados, los puedes mantener, pero no uses router.events ni parchees router.push
    document.addEventListener("next-route-change-start", handleStart)
    document.addEventListener("next-route-change-complete", handleComplete)

    return () => {
      document.removeEventListener("next-route-change-start", handleStart)
      document.removeEventListener("next-route-change-complete", handleComplete)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, userRole, isDarkMode, toggleDarkMode, hasPermission }}>
      {isLoading && <PageTransition />}
      {isLoggedIn && pathname !== "/login" ? (
        <div className="flex min-h-screen">
          <Sidebar onExpandChange={setIsSidebarExpanded} />
          <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? "md:ml-64" : "md:ml-[4.5rem]"}`}>
            <main className="p-6 md:p-10 pt-16 md:pt-10">{children}</main>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
