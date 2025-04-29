"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { storage } from "@/lib/storage"

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = storage.getItem("isLoggedIn")
      if (!isLoggedIn && window.location.pathname !== "/login") {
        router.replace("/login")
      }
    }
  }, [])

  return <>{children}</>
}