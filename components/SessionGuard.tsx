"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [pathname, setPathname] = useState<string | null>(null)

  useEffect(() => {
    setPathname(typeof window !== "undefined" ? window.location.pathname : null)
    const isLoggedIn = storage.getItem("isLoggedIn")
    if (!isLoggedIn && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        router.replace("/login")
      } else {
        setChecked(true)
      }
    } else {
      setChecked(true)
    }
  }, [router])

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (!checked) {
    // Solo mostrar loader si no está chequeado y NO estamos en /login
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-lg">Redirigiendo...</span>
      </div>
    )
  }

  return <>{children}</>
}