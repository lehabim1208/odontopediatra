import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { PatientProvider } from "@/components/patient-context"
import { Toaster } from "@/components/ui/toaster"
import { SessionGuard } from "@/components/SessionGuard"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Consultorio Odontológico Infantil",
  description: "Dashboard para gestión de consultorio odontológico infantil",
    generator: 'Cruz'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <PatientProvider>
            {children}
          </PatientProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
