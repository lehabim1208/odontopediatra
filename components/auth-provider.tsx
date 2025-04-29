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
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Fix the permission check for configuration page
  const hasPermission = useCallback(
    (resource: string) => {
      // Si no está autenticado, no tiene permisos
      if (!isLoggedIn) return false

      // Obtener usuarios del almacenamiento
      const users = storage.getItem("users") || []
      const storedUserRole = storage.getItem("userRole")

      // Buscar el usuario actual por su rol
      const currentUser = users.find((user: any) => user.role === storedUserRole)

      // Si encontramos el usuario y tiene permisos definidos
      if (currentUser && currentUser.permissions) {
        return !!currentUser.permissions[resource]
      }

      // Si es doctor y no encontramos permisos específicos, tiene acceso a todo por defecto
      if (storedUserRole === "doctor") return true

      // Permisos por defecto para secretaria
      if (storedUserRole === "secretary") {
        const allowedResources = ["pacientes", "citas"]
        return allowedResources.includes(resource)
      }

      return false
    },
    [isLoggedIn],
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
      // Inicializar usuarios por defecto
      initializeDefaultUsers()

      const isAuthenticated = storage.getItem("isLoggedIn")
      const storedUserRole = storage.getItem("userRole")
      const darkMode = storage.getItem("darkMode")

      setIsLoggedIn(!!isAuthenticated)
      setUserRole(storedUserRole)
      setIsDarkMode(!!darkMode)

      if (!!darkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }

      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && storedUserRole) {
        // Verificar permisos para la página actual
        const pathSegments = pathname.split("/").filter(Boolean)
        const currentPage = pathSegments.length > 0 ? pathSegments[0] : ""

        // Obtener usuarios del almacenamiento
        const users = storage.getItem("users") || []
        const currentUser = users.find((user: any) => user.role === storedUserRole)

        // Verificar si el usuario tiene permiso para acceder a la página actual
        if (currentPage && currentPage !== "login" && currentUser && currentUser.permissions) {
          const hasAccess =
            currentPage === "configuracion"
              ? currentUser.permissions.configuracion
              : currentUser.permissions[currentPage] || false

          if (!hasAccess && currentPage !== "") {
            router.push("/")
          }
        }
      }
    }

    checkAuth()
  }, [pathname, router])

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
      // Aseguramos que la página realmente ha cargado antes de quitar el preloader
      setTimeout(() => setIsLoading(false), 1000)
    }

    // Create custom event for route changes
    const startEvent = new Event("next-route-change-start")
    const completeEvent = new Event("next-route-change-complete")

    // Simulate route change events for Next.js
    router.events = {
      on: (event: string, callback: () => void) => {
        if (event === "routeChangeStart") document.addEventListener("next-route-change-start", callback)
        if (event === "routeChangeComplete") document.addEventListener("next-route-change-complete", callback)
      },
      off: (event: string, callback: () => void) => {
        if (event === "routeChangeStart") document.removeEventListener("next-route-change-start", callback)
        if (event === "routeChangeComplete") document.removeEventListener("next-route-change-complete", callback)
      },
      emit: (event: string) => {
        if (event === "routeChangeStart") document.dispatchEvent(startEvent)
        if (event === "routeChangeComplete") document.dispatchEvent(completeEvent)
      },
    }

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)

    // Patch the router.push method to emit events
    const originalPush = router.push
    router.push = function (...args: any[]) {
      router.events.emit("routeChangeStart")
      const result = originalPush.apply(this, args)

      // Emitir el evento de completado solo cuando la navegación realmente ha terminado
      window.addEventListener(
        "load",
        () => {
          router.events.emit("routeChangeComplete")
        },
        { once: true },
      )

      // Fallback por si el evento load no se dispara
      setTimeout(() => {
        router.events.emit("routeChangeComplete")
      }, 1000)

      return result
    }

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
    }
  }, [router])

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
