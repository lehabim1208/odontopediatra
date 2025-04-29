"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type Theme = "light" | "dark" | "system"

interface ThemeContextProps {
  theme?: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "system",
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme as Theme
    }
    return (localStorage.getItem("theme") || defaultTheme) as Theme
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement

    function updateTheme(theme: Theme) {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        root.setAttribute(attribute, systemTheme)
        return
      }
      root.setAttribute(attribute, theme)
    }

    updateTheme(theme)
  }, [theme, attribute])

  const contextValue: ThemeContextProps = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
      localStorage.setItem("theme", theme)
    },
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
