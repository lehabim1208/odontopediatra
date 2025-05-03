"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { storage } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import { User, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const { setIsLoggedIn } = useAuth()
  const [role, setRole] = useState<"doctor" | "secretary">("doctor")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Cargando...")

  // Función para alternar mensajes de carga
  useEffect(() => {
    if (isLoading) {
      const messages = ["Cargando...", "Iniciando sesión...", "Conectando con la base de datos...", "Preparando el sistema...", "Cargando información..."]
      let currentIndex = 0

      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length
        setLoadingMessage(messages[currentIndex])
      }, 800) // Cambiar mensaje cada 800ms

      return () => clearInterval(interval)
    }
  }, [isLoading])

  // Después de login exitoso, guardar usuario en localStorage
  const handleLoginSuccess = (user: any) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("currentUser", JSON.stringify({
        id: user.id,
        name: user.name || user.nombre,
        username: user.username || user.usuario,
        email: user.email || user.correo
      }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        handleLoginSuccess(data.user);
        storage.setItem("isLoggedIn", true);
        storage.setItem("userRole", role);
        storage.setItem("currentUserId", data.user.id); // Guardar el id del usuario
        setIsLoggedIn(true);
        document.cookie = `isLoggedIn=true; path=/; max-age=86400`;
        window.location.href = "/"; // Fuerza recarga total
        // router.push("/"); // Quitar esta línea si existe
      } else {
        setError(data.error || "Usuario o contraseña incorrectos");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {isLoading ? (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
        </div>
      ) : null}

      <Card className="w-[400px] border-blue-200 shadow-xl overflow-hidden dark:bg-gray-900 dark:border-gray-700">
        <div className="flex w-full overflow-hidden">
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              role === "doctor"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-gray-600 dark:hover:text-white"
            }`}
            onClick={() => setRole("doctor")}
            type="button"
          >
            <User className="h-5 w-5 mx-auto mb-1" />
            <span>Doctor</span>
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              role === "secretary"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-gray-700 dark:text-blue-300 dark:hover:bg-gray-600 dark:hover:text-white"
            }`}
            onClick={() => setRole("secretary")}
            type="button"
          >
            <User className="h-5 w-5 mx-auto mb-1" />
            <span>Secretaria</span>
          </button>
        </div>
        <div className="bg-white p-6 flex justify-center login-header dark:bg-gray-800">
          <img src="/images/logo-emmanuel-severino.png" alt="Logo Emmanuel Severino" className="h-auto w-48" />
        </div>
        <CardHeader className="pb-2 bg-white dark:bg-gray-800">
          <CardTitle className="text-blue-800 text-center text-xl dark:text-blue-300">Inicio de sesión</CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-4 dark:bg-gray-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium leading-none text-gray-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200"
              >
                Usuario
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === "doctor" ? "Usuario" : "Secretaria"}
                className="border-blue-200 focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                autoFocus={false}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none text-gray-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-200"
              >
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="border-blue-200 focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                  required
                  autoFocus={false}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Procesando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
