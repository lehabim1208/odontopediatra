"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Plus } from "lucide-react"
import { storage } from "@/lib/storage"
import { useAuth } from "@/components/auth-provider"
import { format, parseISO, isSameDay, startOfDay, endOfDay, addDays } from "date-fns"
import { es } from "date-fns/locale"

export default function Home() {
  const router = useRouter()
  const { userRole, hasPermission } = useAuth()
  const [stats, setStats] = useState({
    totalAppointments: 0,
    newPatients: 0,
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [greeting, setGreeting] = useState("")
  const [userName, setUserName] = useState("")
  const [userTitle, setUserTitle] = useState("")
  const [unconfirmedAppointments, setUnconfirmedAppointments] = useState<any[]>([])
  const [confirmationFilter, setConfirmationFilter] = useState<"all" | "confirmed" | "unconfirmed">("all")

  useEffect(() => {
    const isLoggedIn = storage.getItem("isLoggedIn")
    const userId = storage.getItem("currentUserId")
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    // Obtener nombre y rol del usuario desde la base de datos
    if (userId) {
      fetch(`/api/usuarios/me?id=${userId}`)
        .then(async res => {
          if (!res.ok) throw new Error('Error en la respuesta del servidor');
          const text = await res.text();
          if (!text) return null;
          return JSON.parse(text);
        })
        .then(data => {
          if (data && data.nombre) setUserName(data.nombre)
          if (data && data.rol) {
            // Título según rol
            if (data.rol === "doctor") setUserTitle("Dr.")
            else if (data.rol === "doctora") setUserTitle("Dra.")
            else if (data.rol === "secretary") setUserTitle("Srta.")
            else setUserTitle("")
          }
        })
        .catch(() => {
          setUserName("");
          setUserTitle("");
        })
    }

    // Cargar estadísticas y citas desde la base de datos
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        setStats({
          totalAppointments: data.totalAppointments || 0,
          newPatients: data.totalPatients || 0,
        })
      })

    fetch("/api/citas/dashboard")
      .then(res => res.json())
      .then(data => {
        // Filtra las canceladas antes de setear el estado
        setUpcomingAppointments((data.upcomingAppointments || []).filter((a: any) => a.estado !== "cancelada"))
      })

    // Cargar citas por confirmar solo si es secretaria
    if (userRole === "secretary") {
      fetch("/api/citas/unconfirmed")
        .then(res => res.json())
        .then(data => setUnconfirmedAppointments((data.unconfirmedAppointments || []).filter((a: any) => a.estado !== "cancelada")))
    }

    // Filtro predeterminado según rol
    if (userRole === "secretary") setConfirmationFilter("unconfirmed")
    else if (userRole === "doctor" || userRole === "doctora") setConfirmationFilter("confirmed")
    else setConfirmationFilter("all")

    updateGreeting()
  }, [router, userRole])

  const updateGreeting = () => {
    const hour = new Date().getHours()
    let greeting = ""

    if (hour >= 5 && hour < 12) {
      greeting = "Buenos días"
    } else if (hour >= 12 && hour < 19) {
      greeting = "Buenas tardes"
    } else {
      greeting = "Buenas noches"
    }

    setGreeting(greeting)
  }

  const handleFilterChange = (filter: "all" | "confirmed" | "unconfirmed") => {
    setConfirmationFilter(filter)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner de bienvenida */}
      <div className="relative mb-4 bg-primary rounded-lg p-2 md:p-4 text-white overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold mb-0 md:mb-1">{greeting},</h2>
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{userTitle} {userName}</h1>
          <p className="text-md md:text-lg opacity-90">Bienvenido(a) al sistema de gestión dental</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ejemplo%20de%20Inicio.png-1rwNNX2tU9ltbS2Y0uESFIyFwKTaan.webp')] bg-contain bg-right bg-no-repeat opacity-20"></div>
      </div>

      {/* Card de Citas por confirmar hoy (ahora va antes del grid principal) */}
      {hasPermission("citas") && userRole === "secretary" && unconfirmedAppointments.length > 0 && (
        <Card className="col-span-1 lg:col-span-2 mb-4">
          <CardHeader>
            <CardTitle className="text-amber-600">Citas por confirmar hoy</CardTitle>
            <CardDescription>Estas citas necesitan confirmación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unconfirmedAppointments.map((appointment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('selectedAppointmentId', appointment.id.toString())
                    }
                    router.push('/citas')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">Tutor: {appointment.guardian}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type || "Consulta general"}</p>
                      <p className="text-xs text-muted-foreground">{appointment.formattedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.formattedTime}</p>
                    <p className="text-sm text-muted-foreground">{appointment.duration}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 text-amber-600 border-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
      {hasPermission("citas") && (
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2">
            <div>
              <CardTitle>Citas Próximas</CardTitle>
              <CardDescription>Próximos 7 días</CardDescription>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0 w-full md:w-auto">
              {/* Solo mostramos el filtro de confirmación */}
              <div className="flex border rounded-md overflow-hidden w-full md:w-auto">
                <Button
                  variant={confirmationFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none text-xs px-2 flex-1 md:flex-auto"
                  onClick={() => handleFilterChange("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={confirmationFilter === "confirmed" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none text-xs px-2 flex-1 md:flex-auto"
                  onClick={() => handleFilterChange("confirmed")}
                >
                  Confirmadas
                </Button>
                <Button
                  variant={confirmationFilter === "unconfirmed" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none text-xs px-2 flex-1 md:flex-auto"
                  onClick={() => handleFilterChange("unconfirmed")}
                >
                  Pendientes
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.filter(a =>
                a.estado !== "cancelada" &&
                (confirmationFilter === "all"
                  ? a.estado !== "cancelada"
                  : confirmationFilter === "confirmed"
                  ? a.confirmed && a.estado !== "cancelada"
                  : !a.confirmed && a.estado !== "cancelada")
              ).length > 0 ? (
                upcomingAppointments.filter(a =>
                  a.estado !== "cancelada" &&
                  (confirmationFilter === "all"
                    ? a.estado !== "cancelada"
                    : confirmationFilter === "confirmed"
                    ? a.confirmed && a.estado !== "cancelada"
                    : !a.confirmed && a.estado !== "cancelada")
                ).map((appointment, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      appointment.confirmed
                        ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    }`}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.localStorage.setItem('selectedAppointmentId', appointment.id.toString())
                      }
                      router.push('/citas')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          appointment.confirmed ? "bg-green-200 text-green-600" : "bg-blue-200 text-blue-600"
                        }`}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap">
                          <p className="font-medium">{appointment.patientName}</p>
                          {appointment.confirmed && (
                            <span className="ml-2 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                              Confirmada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.type || "Consulta general"}</p>
                        <p className="text-xs text-muted-foreground">{appointment.formattedDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.formattedTime}</p>
                      <p className="text-sm text-muted-foreground">{appointment.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p>
                    No hay citas{" "}
                    {confirmationFilter === "confirmed"
                      ? "confirmadas"
                      : confirmationFilter === "unconfirmed"
                        ? "pendientes"
                        : ""}{" "}
                    para los próximos días
                  </p>
                </div>
              )}
              <Button className="w-full" onClick={() => router.push("/citas")}>
                <Clock className="mr-2 h-4 w-4" /> Ver todas las citas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {(hasPermission("citas") || hasPermission("pacientes")) && (
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {hasPermission("pacientes") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('openNewPatientModal', '1')
                    }
                    router.push("/pacientes")
                  }}
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span>Nuevo Paciente</span>
                </Button>
              )}
              {hasPermission("citas") && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('openNewAppointmentModal', '1')
                    }
                    router.push("/citas")
                  }}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Nueva Cita</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      <div className="grid gap-4 md:gap-6 mt-4 md:mt-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Citas Totales</CardTitle>
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <div className="mt-4 h-1 w-full bg-muted">
              <div className="h-1 w-[75%] bg-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newPatients}</div>
            <div className="mt-4 h-1 w-full bg-muted">
              <div className="h-1 w-[45%] bg-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
