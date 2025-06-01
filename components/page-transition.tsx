"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { LoadingSpinner } from "@/components/loading-spinner"

export function PageTransition() {
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const navigationCompleteRef = useRef(false)

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
      navigationCompleteRef.current = false
    }

    const handleComplete = () => {
      navigationCompleteRef.current = true
      // Volvemos a usar un tiempo fijo de 1000ms
      setTimeout(() => {
        if (navigationCompleteRef.current) {
          setIsLoading(false)
        }
      }, 1000)
    }

    // Añadir event listeners para la navegación
    document.addEventListener("next-route-change-start", handleStart)
    document.addEventListener("next-route-change-complete", handleComplete)

    // Simular evento de navegación completa al montar el componente
    const timer = setTimeout(() => {
      handleComplete()
    }, 1000)

    return () => {
      document.removeEventListener("next-route-change-start", handleStart)
      document.removeEventListener("next-route-change-complete", handleComplete)
      clearTimeout(timer)
    }
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-lg font-medium text-blue-500 animate-pulse-custom">Cargando...</p>
      </div>
    </div>
  )
}
