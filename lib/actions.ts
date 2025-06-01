"use server"

import { storage } from "@/lib/storage"

export async function handleLogin(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // Verificar credenciales
  if (username === "admin" && password === "admin") {
    // Inicializar usuarios por defecto si no existen
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

    // Establecer como doctor
    storage.setItem("isLoggedIn", true)
    storage.setItem("userRole", "doctor")
    storage.setItem("currentUserId", 1)
    // eslint-disable-next-line no-console
    console.log("[handleLogin] Guardando currentUserId: 1")
    storage.setItem("currentUser", {
      id: 1,
      name: "Emmanuel",
      role: "doctor",
    })

    return { success: true, role: "doctor" }
  } else if (username === "marcela" && password === "marcela") {
    // Establecer como secretaria
    storage.setItem("isLoggedIn", true)
    storage.setItem("userRole", "secretary")
    storage.setItem("currentUserId", 2)
    // eslint-disable-next-line no-console
    console.log("[handleLogin] Guardando currentUserId: 2")
    storage.setItem("currentUser", {
      id: 2,
      name: "Marcela",
      role: "secretary",
    })

    return { success: true, role: "secretary" }
  } else {
    // Credenciales incorrectas
    return { success: false, error: "Credenciales incorrectas" }
  }
}
