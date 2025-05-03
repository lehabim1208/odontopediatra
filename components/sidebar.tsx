"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  ChevronLeft,
  Moon,
  Sun,
  UserCog,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { storage } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

// Sidebar state management
const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function Sidebar({ onExpandChange }: { onExpandChange?: (expanded: boolean) => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "",
    role: "",
  })
  const isMobile = useMediaQuery("(max-width: 768px)")

  const { setIsLoggedIn, userRole, isDarkMode, toggleDarkMode, hasPermission } = useAuth()

  // Log temporal para depuración de permisos
  useEffect(() => {   
  }, [userRole, hasPermission])

  // Load sidebar state from cookie on mount
  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
      ?.split("=")[1]

    if (cookieValue === "collapsed") {
      setIsCollapsed(true)
      onExpandChange?.(false)
    } else {
      onExpandChange?.(true)
    }

    // Cargar información del usuario desde localStorage
    const storedUserRole = storage.getItem("userRole")

    // Establecer información del usuario según el rol
    if (storedUserRole === "doctor") {
      setUserInfo({
        name: "Dr. Emmanuel",
        role: "Odontólogo",
      })
    } else if (storedUserRole === "secretary") {
      setUserInfo({
        name: "Srita. Marcela",
        role: "Recepción",
      })
    }
  }, [onExpandChange, userRole])

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onExpandChange?.(!newState)

    // Save state to cookie
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${newState ? "collapsed" : "expanded"}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
  }

  const handleLogout = () => {
    storage.removeItem("isLoggedIn");
    storage.removeItem("userRole");
    setIsLoggedIn(false);
    // Eliminar cookie para el middleware
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    window.location.href = "/login";
  }

  const menuItems = [
    {
      title: "Inicio",
      icon: Home,
      href: "/",
      permission: true, // Todos tienen acceso
    },
    {
      title: "Pacientes",
      icon: Users,
      href: "/pacientes",
      permission: hasPermission("pacientes"),
    },
    {
      title: "Citas",
      icon: CalendarDays,
      href: "/citas",
      permission: hasPermission("citas"),
    },
    {
      title: "Usuarios",
      icon: UserCog,
      href: "/usuarios",
      permission: hasPermission("usuarios"),
    },
    {
      title: "Configuración",
      icon: Settings,
      href: "/configuracion",
      permission: hasPermission("configuracion"),
    },
  ]

  // Agregar el elemento "Acerca de" solo para dispositivos móviles
  if (isMobile) {
    menuItems.push({
      title: "Acerca de",
      icon: Info,
      href: "/acerca-de-movil",
      permission: true, // Todos tienen acceso
    })
  }

  // Filtrar los elementos del menú según los permisos
  const filteredMenuItems = menuItems.filter((item) => item.permission)

  return (
    <>
      {/* Mobile menu */}
      <div className={cn("fixed inset-0 z-50 md:hidden", isOpen ? "block" : "hidden")}>
        {/* Overlay semitransparente */}
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

        {/* Menú desplegable desde arriba */}
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border transition-all duration-300 ease-in-out transform",
            isOpen ? "translate-y-0" : "-translate-y-full",
          )}
        >
          <div className="flex justify-between items-center p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-center w-full">
              {/* Solo el logo en dispositivos móviles */}
              <img src="/images/logo-emmanuel-severino.png" alt="Logo Emmanuel Severino" className="h-12 w-auto" />
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <nav className="space-y-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>

            {/* Theme toggle */}
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              <Button variant="outline" size="default" onClick={toggleDarkMode} className="w-full justify-start">
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    <span>Modo Oscuro</span>
                  </>
                )}
              </Button>
            </div>

            {/* User profile */}
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sidebar-foreground">{userInfo.name}</p>
                  <p className="text-xs text-sidebar-foreground/70">{userInfo.role}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button - moved to top left */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn("p-6 transition-all duration-300", isCollapsed && "p-4 flex justify-center")}>
            {isCollapsed ? (
              <img src="/images/dinosaurio-verde.png" alt="Logo Dinosaurio" className="h-10 w-auto" />
            ) : (
              <img
                src="/images/logo-emmanuel-severino.png"
                alt="Logo Emmanuel Severino"
                className="h-auto w-full max-w-[200px]"
              />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-sidebar-accent text-sidebar-foreground",
                  isCollapsed && "justify-center px-2",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>

          {/* Theme toggle */}
          <div className={cn("px-4 py-2", isCollapsed && "flex justify-center")}>
            <Button
              variant="outline"
              size={isCollapsed ? "icon" : "default"}
              onClick={toggleDarkMode}
              className={cn("w-full", isCollapsed ? "flex items-center justify-center p-2" : "justify-start")}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Modo Claro</span>}
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Modo Oscuro</span>}
                </>
              )}
            </Button>
          </div>

          {/* User profile */}
          <div
            className={cn("p-4 mt-auto border-t border-sidebar-border", isCollapsed && "flex flex-col items-center")}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sidebar-foreground">{userInfo.name}</p>
                  <p className="text-xs text-sidebar-foreground/70">{userInfo.role}</p>
                </div>
              </div>
            )}

            {isCollapsed ? (
              <Button variant="outline" className="w-10 h-10 rounded-full" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            )}
          </div>

          {/* Collapse toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -right-3 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
            onClick={toggleSidebar}
          >
            <ChevronLeft className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      </div>
    </>
  )
}
