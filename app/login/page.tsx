"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { useAuth } from "@/components/auth-provider";
import { Eye, EyeOff } from "lucide-react";

const licenciaMessages: Record<number, string> = {
  1: "No se pudo validar la licencia. Código: EMSE-001-LI",
  2: "Error interno, intente más tarde. Código: EMSE-002-ER",
  3: "Fallo crítico al validar la licencia. Sistema no disponible. Código: EMSE-003-LI2",
  4: "Sistema en mantenimiento, intente más tarde. Código: EMSE-004-MA",
  5: "Sistema no disponible en este momento. Esto es una falla temporal. Cargando protocolo de recuperación, espere unos minutos y vuelva a intentarlo. Código: EMSE-005-RE",
  6: "El sistema se ha bloqueado temporalmente. Se ha detectado el incumplimiento de los términos y condiciones de la licencia. Código: EMSE-006-BL",
  7: "¡Sistema corrupto! Se ha detectado una modificación en el código fuente. Código: EMSE-007-CO",
  8: "No se ha podido recuperar la información. Código: EMSE-008-INF",
  9: "Acceso denegado. Licencia expirada o invalida. Código: EMSE-009-LI3",
  10: "Error en el servidor. Código: EMSE-010-SE",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const [showLogo, setShowLogo] = useState(false);

  const [licenciaError, setLicenciaError] = useState<number | null>(null);
  const [showLicenciaModal, setShowLicenciaModal] = useState(false);

  useEffect(() => {
    setShowLogo(true);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const messages = [
        "Cargando...",
        "Iniciando sesión...",
        "Conectando con la base de datos...",
        "Preparando el sistema...",
        "Cargando información...",
      ];
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleLoginSuccess = (user: any) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: user.id,
          name: user.name || user.nombre,
          username: user.username || user.usuario,
          email: user.email || user.correo,
        })
      );
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      // Mostrar modal si hay error de licencia, incluso si res.ok es false
      if (data.licenciaError) {
        setLicenciaError(data.licenciaError);
        setShowLicenciaModal(true);
        setIsLoading(false);
        return;
      }

      if (res.ok) {
        handleLoginSuccess(data.user);
        storage.setItem("isLoggedIn", "true");
        storage.setItem("userRole", data.user.role || data.user.rol);
        storage.setItem("currentUserId", String(data.user.id));
        setIsLoggedIn(true);

        try {
          const permisosRes = await fetch(`/api/usuarios/${data.user.id}`);
          if (permisosRes.ok) {
            const permisosData = await permisosRes.json();
            storage.setItem("userPermissions", permisosData.permissions || {});
          }
        } catch {}

        setTimeout(() => router.push("/"), 100);
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
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">{loadingMessage}</p>
        </div>
      )}

      <Card className="w-[400px] border-blue-200 shadow-xl overflow-hidden dark:bg-gray-900 dark:border-gray-700">
        <div className="bg-white p-6 flex justify-center login-header dark:bg-gray-800">
          {showLogo && (
            <img
              src="/images/logo-emmanuel-severino.png"
              alt="Logo Emmanuel Severino"
              className="h-auto w-48"
            />
          )}
        </div>
        <CardHeader className="pb-2 bg-white dark:bg-gray-800">
          <CardTitle className="text-blue-800 text-center text-xl dark:text-blue-300">
            Inicio de sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white pt-4 dark:bg-gray-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Usuario
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario"
                className="border-blue-200 focus:border-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-800 dark:text-gray-200">
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

      {/* Modal de error de licencia */}
      {showLicenciaModal && licenciaError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 border border-red-300 relative">
            <button
              className="absolute top-2 right-2 text-red-700 hover:text-red-500 text-lg font-bold"
              onClick={() => setShowLicenciaModal(false)}
            >
              ×
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 text-red-700 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-.01-6a9 9 0 11-9 9 9 9 0 019-9z" />
                </svg>
              </div>
              <h2 className="text-red-700 font-semibold text-lg">Error de licencia</h2>
            </div>
            <p className="text-red-700 font-medium mb-2">{licenciaMessages[licenciaError]}</p>
            <p className="text-sm text-gray-700 mb-2">
              Por favor contacte a soporte técnico para obtener ayuda. Su información está a salvo y será
              restablecida al solucionar este error. Es necesario tener una conexión de internet estable para asistencia remota.
            </p>
            <p className="text-sm text-blue-600 text-right">
              {new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
            </p>
            <div className="mt-4 text-right">
              <Button
                variant="outline"
                className="text-red-600 border-red-300"
                onClick={() => setShowLicenciaModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}