"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  addWeeks,
  isSameDay,
  isWithinInterval,
  addMinutes,
  isBefore,
} from "date-fns"
import { es } from "date-fns/locale"
import { useMediaQuery } from "@/hooks/use-media-query"
import { storage } from "@/lib/storage"
import { Dialog as Modal, DialogContent as ModalContent, DialogHeader as ModalHeader, DialogTitle as ModalTitle } from "@/components/ui/dialog"

// Cambia el modelo Appointment para reflejar la base de datos y facilitar el mapeo
interface Appointment {
  id: number
  paciente_id: number
  usuario_id: number
  fecha_hora: string // ISO string
  tipo: string
  duracion: string
  notas: string
  estado: string
  // Para UI
  patientName?: string
  guardian?: string
  confirmed?: boolean
  date?: string
  time?: string
  duration?: number
}

// Actualizar los horarios del consultorio
const CLINIC_START_TIME = 9 // 9:00 AM
const CLINIC_END_TIME = 20.5 // 8:30 PM
const LUNCH_START = 13 // 1:00 PM
const LUNCH_END = 16.5 // 4:30 PM

// Utilidad para formatear hora a 12h con a.m./p.m.
function formatTimeTo12h(time: string) {
  if (!time) return "-"
  const [h, m] = time.split(":").map(Number)
  const hour = ((h + 11) % 12) + 1
  const ampm = h < 12 ? "a.m." : "p.m."
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

// Utilidad para formatear fecha YYYY-MM-DD a 'd de mes año'
function formatDateToSpanish(date: string) {
  if (!date) return "-"
  const [year, month, day] = date.split("-")
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ]
  return `${parseInt(day)} de ${meses[parseInt(month) - 1]} ${year}`
}

// Utilidad para crear un Date local a partir de date y time (sin desfase)
function getLocalDate(date: string, time: string) {
  if (!date || !time) return new Date(NaN)
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const localDate = new Date(year, month - 1, day, hour, minute)
  return localDate
}

export default function CitasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientIdFromUrl = searchParams.get("patient")
  const { toast } = useToast()
  const patientIdRef = useRef<string | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false)
  const [showEditAppointmentDialog, setShowEditAppointmentDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [showTimePassedWarning, setShowTimePassedWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [recommendedTime, setRecommendedTime] = useState<string | null>(null)
  const [minTime, setMinTime] = useState(format(new Date(), "HH:mm"))
  const [patientSearchQuery, setPatientSearchQuery] = useState<string>("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [isProcessingWarning, setIsProcessingWarning] = useState(false)
  const [patientInfo, setPatientInfo] = useState<any>(null)

  const [newAppointment, setNewAppointment] = useState<Appointment>({
    id: 0,
    paciente_id: 0,
    usuario_id: 1,
    fecha_hora: "",
    tipo: "Consulta de valoración",
    duracion: "30",
    notas: "",
    estado: "pendiente",
  })

  // Efecto para establecer la vista en "day" en dispositivos móviles
  useEffect(() => {
    if (isMobile && view !== "day") {
      setView("day")
    }
  }, [isMobile, view])

  // Cargar citas desde la API
  const fetchAppointments = async () => {
    const res = await fetch("/api/citas")
    if (res.ok) {
      const data = await res.json()
      setAppointments(
        data.map((cita: any) => {
          const fecha = new Date(cita.fecha_hora)
          const date = fecha.toLocaleDateString('sv-SE') // YYYY-MM-DD
          const time = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) // HH:mm
          return {
            ...cita,
            confirmed: cita.estado === "confirmada",
            date,
            time,
            duration: parseInt(cita.duracion),
          }
        })
      )
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Buscar pacientes en la base de datos
  const fetchPatients = async (query: string) => {
    if (!query) {
      setPatients([])
      return
    }
    try {
      const res = await fetch(`/api/pacientes?search=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        // Si la respuesta es un array directo
        if (Array.isArray(data)) {
          setPatients(data)
        } else if (Array.isArray(data.patients)) {
          setPatients(data.patients)
        } else {
          setPatients([])
        }
      } else {
        setPatients([])
      }
    } catch {
      setPatients([])
    }
  }

  // Modificar el useEffect para manejar la apertura del modal de cita cuando se navega desde la página de inicio
  useEffect(() => {
    const timer = setTimeout(() => {
      const storedPatients = storage.getItem("patients")
      if (storedPatients) {
        setPatients(storedPatients)
      }

      const appointmentId = searchParams.get("appointmentId")
      if (appointmentId) {
        const appointment = appointments.find((app) => app.id.toString() === appointmentId)
        if (appointment) {
          setSelectedAppointment(appointment)
          setShowInfoDialog(true)
        }
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [searchParams, appointments])

  useEffect(() => {
    if (patientIdFromUrl) {
      patientIdRef.current = patientIdFromUrl

      const patients = storage.getItem("patients") || []
      const patient = patients.find((p: any) => p.id.toString() === patientIdFromUrl)

      if (patient) {
        setNewAppointment((prev) => ({
          ...prev,
          paciente_id: parseInt(patientIdFromUrl),
          patientName: patient.name,
        }))
        setPatientSearchQuery(patient.name)
        setShowNewAppointmentDialog(true)

        window.history.replaceState({}, document.title, "/citas")
      }
    }
  }, [patientIdFromUrl])

  useEffect(() => {
    const fetchPatientNames = async () => {
      const uniqueIds = Array.from(new Set(appointments.map(a => a.paciente_id)))
      if (uniqueIds.length === 0) return
      const res = await fetch(`/api/pacientes?ids=${uniqueIds.join(",")}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(prev => prev.map(app => {
          const patient = Array.isArray(data)
            ? data.find((p: any) => p.id === app.paciente_id)
            : (data.patients || []).find((p: any) => p.id === app.paciente_id)
          return { ...app, patientName: patient?.name || "" }
        }))
      }
    }
    fetchPatientNames()
    // eslint-disable-next-line
  }, [appointments.length])

  useEffect(() => {
    if (showInfoDialog && selectedAppointment?.paciente_id) {
      fetch(`/api/pacientes?id=${selectedAppointment.paciente_id}`)
        .then(res => res.json())
        .then(data => setPatientInfo(Array.isArray(data) ? data[0] : data))
        .catch(() => setPatientInfo(null))
    } else if (!showInfoDialog) {
      setPatientInfo(null)
    }
  }, [showInfoDialog, selectedAppointment])

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prevDate) => {
      if (view === "day") {
        return addDays(prevDate, direction === "prev" ? -1 : 1)
      } else if (view === "week") {
        return addWeeks(prevDate, direction === "prev" ? -1 : 1)
      } else {
        return addDays(prevDate, direction === "prev" ? -30 : 30)
      }
    })
  }

  const isWithinClinicHours = (time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number)
    const hourDecimal = hours + minutes / 60

    return (
      (hourDecimal >= CLINIC_START_TIME && hourDecimal < LUNCH_START) ||
      (hourDecimal >= LUNCH_END && hourDecimal < CLINIC_END_TIME)
    )
  }

  const isAppointmentOverlap = (date: string, time: string, duration: number, excludeId?: number): boolean => {
    const newAppStart = getLocalDate(date, time)
    const newAppEnd = addMinutes(newAppStart, duration)

    return appointments.some((app) => {
      if (excludeId && app.id === excludeId) return false
      const appStart = getLocalDate(app.date || "", app.time || "")
      const appEnd = addMinutes(appStart, app.duration ?? 0)
      return (
        isWithinInterval(newAppStart, { start: appStart, end: appEnd }) ||
        isWithinInterval(newAppEnd, { start: appStart, end: appEnd }) ||
        (newAppStart <= appStart && newAppEnd >= appEnd)
      )
    })
  }

  const findNextAvailableSlot = (date: string, time: string, duration: number): string => {
    let currentTime = getLocalDate(date, time)
    const endOfDay = getLocalDate(date, `${CLINIC_END_TIME}:00`)
    const lunchStart = getLocalDate(date, `${LUNCH_START}:00`)
    const lunchEnd = getLocalDate(date, `${LUNCH_END}:00`)

    while (currentTime < endOfDay) {
      if (isWithinInterval(currentTime, { start: lunchStart, end: lunchEnd })) {
        currentTime = lunchEnd
        continue
      }
      const timeStr = format(currentTime, "HH:mm")
      if (isWithinClinicHours(timeStr) && !isAppointmentOverlap(date, timeStr, duration)) {
        return timeStr
      }
      currentTime = addMinutes(currentTime, 15)
    }
    const nextDay = addDays(getLocalDate(date, "00:00"), 1)
    return findNextAvailableSlot(format(nextDay, "yyyy-MM-dd"), `${CLINIC_START_TIME}:00`, duration)
  }

  const isTimeInPast = (date: string, time: string): boolean => {
    const appointmentDateTime = getLocalDate(date, time)
    const now = new Date()
    return isBefore(appointmentDateTime, now)
  }

  const resetNewAppointmentForm = () => {
    setNewAppointment({
      id: 0,
      paciente_id: 0,
      usuario_id: 1,
      fecha_hora: "",
      tipo: "Consulta de valoración",
      duracion: "30",
      notas: "",
      estado: "pendiente",
    })
    setPatientSearchQuery("")
    patientIdRef.current = null
  }

  const handleAddAppointment = async (appointmentData: Partial<Appointment>) => {
    // Validar solapamiento antes de guardar
    const duration = Number(appointmentData.duration || 30)
    if (isAppointmentOverlap(appointmentData.date!, appointmentData.time!, duration)) {
      // Calcular próxima hora disponible
      const nextTime = findNextAvailableSlot(appointmentData.date!, appointmentData.time!, duration)
      setRecommendedTime(nextTime)
      setWarningMessage("El horario seleccionado choca con otra cita. Te sugerimos la próxima hora disponible.")
      setShowWarningDialog(true)
      return
    }
    const cita = {
      paciente_id: appointmentData.paciente_id,
      usuario_id: appointmentData.usuario_id || 1,
      fecha_hora: `${appointmentData.date}T${appointmentData.time}`,
      tipo: appointmentData.tipo,
      duracion: (appointmentData.duration || 30).toString(),
      notas: appointmentData.notas || "",
      estado: "pendiente",
    }
    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cita),
    })
    if (res.ok) {
      fetchAppointments()
      setShowNewAppointmentDialog(false)
      toast({ title: "Éxito", description: "Cita agendada correctamente", variant: "success" })
    } else {
      toast({ title: "Error", description: "No se pudo agendar la cita", variant: "destructive" })
    }
  }

  const handleEditAppointment = async (appointmentData: Appointment) => {
    const cita = {
      id: appointmentData.id,
      paciente_id: appointmentData.paciente_id,
      usuario_id: appointmentData.usuario_id || 1,
      fecha_hora: `${appointmentData.date}T${appointmentData.time}`,
      tipo: appointmentData.tipo,
      duracion: (appointmentData.duration || 30).toString(),
      notas: appointmentData.notas || "",
      estado: appointmentData.confirmed ? "confirmada" : appointmentData.estado || "pendiente",
    }
    const res = await fetch("/api/citas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cita),
    })
    if (res.ok) {
      fetchAppointments()
      setShowEditAppointmentDialog(false)
      toast({ title: "Éxito", description: "Cita actualizada correctamente", variant: "success" })
    } else {
      toast({ title: "Error", description: "No se pudo actualizar la cita", variant: "destructive" })
    }
  }

  const handleCancelAppointment = async (id: number) => {
    if (!confirm("¿Está seguro de que desea cancelar esta cita?")) return
    const res = await fetch("/api/citas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      fetchAppointments()
      toast({ title: "Éxito", description: "Cita cancelada correctamente", variant: "success" })
    } else {
      toast({ title: "Error", description: "No se pudo cancelar la cita", variant: "destructive" })
    }
  }

  const handleConfirmAppointment = async (id: number) => {
    const res = await fetch("/api/citas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: "confirmada" }),
    })
    if (res.ok) {
      fetchAppointments()
      toast({ title: "Éxito", description: "Cita confirmada correctamente", variant: "success" })
    } else {
      toast({ title: "Error", description: "No se pudo confirmar la cita", variant: "destructive" })
    }
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowInfoDialog(true)
  }

  const updateMinTime = (date: string) => {
    if (isSameDay(getLocalDate(date, "00:00"), new Date())) {
      setMinTime(format(new Date(), "HH:mm"))
    } else {
      setMinTime("09:00")
    }
  }

  // WeekView: cuadrícula semanal tipo Google Calendar
  function WeekView() {
    // Calcular los días de la semana actual (lunes a domingo)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Horas de la cuadrícula (9:00 a 20:30 cada 30 min)
    const hours: string[] = []
    for (let h = 9; h <= 20; h++) {
      hours.push(`${h.toString().padStart(2, "0")}:00`)
      if (h !== 20) hours.push(`${h.toString().padStart(2, "0")}:30`)
    }

    // Citas de la semana (comparar fechas como string, no parseISO)
    const weekAppointments = appointments.filter(app => {
      if (!app.date) return false
      const match = days.some(day => app.date === format(day, "yyyy-MM-dd"))
      return match
    })

    // Render
    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 min-w-[900px] border rounded">
          {/* Header: días */}
          <div className="bg-muted border-b border-r h-12 flex items-center justify-center font-bold text-sm">Hora</div>
          {days.map((day, idx) => (
            <div key={idx} className="bg-muted border-b border-r h-12 flex items-center justify-center font-bold text-sm">
              {format(day, "EEE d", { locale: es })}
            </div>
          ))}
          {/* Filas de horas */}
          {hours.map((hour, rowIdx) => (
            <React.Fragment key={rowIdx}>
              {/* Columna de hora */}
              <div key={`h-${hour}`} className="border-b border-r h-16 flex items-center justify-center text-xs bg-muted/50">
                {hour}
              </div>
              {/* Celdas de días */}
              {days.map((day, colIdx) => {
                // Marcar horario de comida
                const [h, m] = hour.split(":").map(Number)
                const hourDecimal = h + m / 60
                const isLunch = hourDecimal >= LUNCH_START && hourDecimal < LUNCH_END
                // Buscar citas que inician en este día/hora (comparar strings)
                const cellAppointments = weekAppointments.filter(app => {
                  return app.date === format(day, "yyyy-MM-dd") && app.time === hour
                })
                // Renderizar cada cita con altura proporcional a la duración
                return (
                  <div key={`cell-${rowIdx}-${colIdx}`} className={`border-b border-r h-16 relative ${isLunch ? "bg-gray-300" : ""}`}>
                    {cellAppointments.map(app => {
                      // Calcular slots de 30 min
                      const durationMin = Number(app.duracion || app.duration || 30)
                      const slots = Math.ceil(durationMin / 30)
                      // Altura base: h-16 (64px) por slot
                      const height = 64 * slots
                      return (
                        <div
                          key={app.id}
                          className={`absolute left-1 right-1 top-1 rounded px-2 py-1 text-xs cursor-pointer shadow 
                            ${app.estado === "confirmada" ? "bg-green-600" : "bg-primary/90"} text-white`}
                          style={{ zIndex: 2, height: `${height - 8}px` }}
                          onClick={() => handleAppointmentClick(app)}
                        >
                          <div className="font-semibold truncate">{app.patientName}</div>
                          <div className="truncate">{app.tipo}</div>
                          <div className="truncate">{formatTimeTo12h(app.time || "")} ({durationMin} min)</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  // Vista de Día
  function DayView() {
    const day = currentDate
    // Horas de la cuadrícula (9:00 a 20:30 cada 30 min)
    const hours: string[] = []
    for (let h = 9; h <= 20; h++) {
      hours.push(`${h.toString().padStart(2, "0")}:00`)
      if (h !== 20) hours.push(`${h.toString().padStart(2, "0")}:30`)
    }
    // Citas del día
    const dayAppointments = appointments.filter(app => app.date === format(day, "yyyy-MM-dd"))
    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 min-w-[350px] border rounded">
          {/* Header */}
          <div className="bg-muted border-b border-r h-12 flex items-center justify-center font-bold text-sm">Hora</div>
          <div className="bg-muted border-b h-12 flex items-center justify-center font-bold text-sm">
            {format(day, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </div>
          {/* Filas de horas */}
          {hours.map((hour, rowIdx) => {
            // Marcar horario de comida
            const [h, m] = hour.split(":").map(Number)
            const hourDecimal = h + m / 60
            const isLunch = hourDecimal >= LUNCH_START && hourDecimal < LUNCH_END
            // Citas que inician en este slot
            const cellAppointments = dayAppointments.filter(app => app.time === hour)
            return (
              <React.Fragment key={rowIdx}>
                <div className="border-b border-r h-16 flex items-center justify-center text-xs bg-muted/50">{hour}</div>
                <div className={`border-b h-16 relative ${isLunch ? "bg-gray-300" : ""}`}>
                  {cellAppointments.map(app => {
                    const durationMin = Number(app.duracion || app.duration || 30)
                    const slots = Math.ceil(durationMin / 30)
                    const height = 64 * slots
                    return (
                      <div
                        key={app.id}
                        className={`absolute left-1 right-1 top-1 rounded px-2 py-1 text-xs cursor-pointer shadow ${app.estado === "confirmada" ? "bg-green-600" : "bg-primary/90"} text-white`}
                        style={{ zIndex: 2, height: `${height - 8}px` }}
                        onClick={() => handleAppointmentClick(app)}
                      >
                        <div className="font-semibold truncate">{app.patientName}</div>
                        <div className="truncate">{app.tipo}</div>
                        <div className="truncate">{formatTimeTo12h(app.time || "")} ({durationMin} min)</div>
                      </div>
                    )
                  })}
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  // Vista de Mes
  function MonthView() {
    // Primer día del mes
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    // Último día del mes
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    // Primer día a mostrar (lunes anterior o igual al primer día del mes)
    const start = startOfWeek(firstDay, { weekStartsOn: 1 })
    // Último día a mostrar (domingo posterior o igual al último día del mes)
    const end = endOfWeek(lastDay, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    // Agrupar citas por día
    const appointmentsByDay: Record<string, Appointment[]> = {}
    appointments.forEach(app => {
      if (!app.date) return
      if (!appointmentsByDay[app.date]) appointmentsByDay[app.date] = []
      appointmentsByDay[app.date].push(app)
    })
    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[900px] border rounded">
          {/* Header: días de la semana */}
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, idx) => (
            <div key={idx} className="bg-muted border-b h-12 flex items-center justify-center font-bold text-sm">{d}</div>
          ))}
          {/* Celdas del mes */}
          {days.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const dayAppointments = appointmentsByDay[dateStr] || []
            return (
              <div key={idx} className={`border-b border-r min-h-[90px] p-1 align-top ${isCurrentMonth ? "bg-white" : "bg-muted/50"}`}>
                <div className="text-xs font-bold mb-1 text-right">{day.getDate()}</div>
                {dayAppointments.slice(0, 3).map(app => (
                  <div
                    key={app.id}
                    className={`mb-1 px-1 py-0.5 rounded text-xs cursor-pointer truncate ${app.estado === "confirmada" ? "bg-green-600 text-white" : "bg-primary/90 text-white"}`}
                    onClick={() => handleAppointmentClick(app)}
                    title={`${app.patientName} - ${formatTimeTo12h(app.time || "")}`}
                  >
                    {formatTimeTo12h(app.time || "")} {app.patientName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">+{dayAppointments.length - 3} más</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Citas</h1>
          <p className="text-muted-foreground">Gestiona las citas de los pacientes</p>
        </div>
        <Button onClick={() => setShowNewAppointmentDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Cita
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <CardTitle>Agenda</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {format(currentDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-2 md:mt-0 w-full md:w-auto">
            <Select
              value={view}
              onValueChange={(value: "day" | "week" | "month") => setView(value)}
              disabled={isMobile}
            >
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="Seleccionar vista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week" disabled={isMobile}>
                  Semana
                </SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("prev")}
                className="flex-1 md:flex-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate("next")}
                className="flex-1 md:flex-auto"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "day" && <DayView />}
          {view === "week" && !isMobile && <WeekView />}
          {view === "week" && isMobile && <DayView />}
          {view === "month" && <MonthView />}
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog
        open={showNewAppointmentDialog}
        onOpenChange={(open) => {
          setShowNewAppointmentDialog(open)
          if (!open) {
            resetNewAppointmentForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>
              Programe una nueva cita para un paciente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient" className="text-right">
                  Paciente *
                </Label>
                <div className="col-span-3 space-y-1">
                  <div>
                    <Input
                      id="patientSearch"
                      placeholder="Buscar paciente por nombre..."
                      value={patientSearchQuery || ""}
                      onChange={(e) => {
                        setPatientSearchQuery(e.target.value)
                        setShowPatientDropdown(e.target.value.length > 0)
                        fetchPatients(e.target.value)
                      }}
                      className="w-full"
                    />
                    {showPatientDropdown && (
                      <div className="absolute z-10 w-full max-w-[320px] mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {patients
                          .filter((patient: any) =>
                            patient.name.toLowerCase().includes((patientSearchQuery || "").toLowerCase()),
                          )
                          .map((patient: any) => (
                            <div
                              key={patient.id}
                              className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                              onClick={() => {
                                setNewAppointment({
                                  ...newAppointment,
                                  paciente_id: patient.id,
                                  patientName: patient.name,
                                })
                                setPatientSearchQuery(patient.name)
                                setShowPatientDropdown(false)
                              }}
                            >
                              <div className="font-medium">{patient.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center justify-between">
                                <span>Tutor: {patient.guardian}</span>
                                {patient.phone && <span className="text-gray-400">Tel: {patient.phone}</span>}
                              </div>
                            </div>
                          ))}
                        {patients.filter((patient: any) =>
                          patient.name.toLowerCase().includes((patientSearchQuery || "").toLowerCase()),
                        ).length === 0 && (
                          <div className="p-2 text-center text-muted-foreground">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
                  </div>
                  {newAppointment.paciente_id > 0 && (() => {
                    const patient = patients.find((p: any) => p.id === newAppointment.paciente_id)
                    if (patient) {
                      return (
                        <div className="mt-2 text-sm text-muted-foreground border rounded p-2 bg-muted/30">
                          <div><b>Tutor:</b> {patient.guardian || "Sin tutor registrado"}</div>
                          <div><b>Teléfono:</b> {patient.phone || "Sin teléfono"}</div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="date"
                    type="date"
                    value={newAppointment.date || ""}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => {
                      setNewAppointment({ ...newAppointment, date: e.target.value })
                      updateMinTime(e.target.value)
                    }}
                    required
                    className="date-input"
                    autoFocus={false}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Hora *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="time"
                    type="time"
                    value={newAppointment.time || ""}
                    min={minTime}
                    max="20:30"
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    required
                    className="time-input"
                    autoFocus={false}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Horarios disponibles: 9:00 AM - 1:00 PM y 4:30 PM - 8:30 PM
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duración
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newAppointment.duration?.toString()}
                    onValueChange={(value) =>
                      setNewAppointment({ ...newAppointment, duration: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1 hora 30 minutos</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipo *
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newAppointment.tipo}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta de valoración">Consulta de valoración</SelectItem>
                      <SelectItem value="Consulta subsecuente">Consulta subsecuente</SelectItem>
                      <SelectItem value="Consulta de 6 meses">Consulta de 6 meses</SelectItem>
                      <SelectItem value="Resinas">Resinas</SelectItem>
                      <SelectItem value="Extracción">Extracción</SelectItem>
                      <SelectItem value="Pulpotomía">Pulpotomía</SelectItem>
                      <SelectItem value="Pulpectomía">Pulpectomía</SelectItem>
                      <SelectItem value="Urgencia">Urgencia</SelectItem>
                      <SelectItem value="Toma de impresión">Toma de impresión</SelectItem>
                      <SelectItem value="Quirófano">Quirófano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={newAppointment.notas}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notas: e.target.value })}
                  className="col-span-3"
                  placeholder="Notas adicionales sobre la cita"
                  autoFocus={false}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewAppointmentDialog(false)
                resetNewAppointmentForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleAddAppointment(newAppointment)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de advertencia de solapamiento */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-500 w-8 h-8" />
                <span className="text-yellow-700">Advertencia de horario</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-base">{warningMessage}</div>
          {recommendedTime && (
            <div className="mb-4 text-sm">
              <b>Próxima hora disponible:</b> {recommendedTime}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>Cancelar</Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => {
              if (recommendedTime) {
                setNewAppointment(prev => ({ ...prev, time: recommendedTime }))
              }
              setShowWarningDialog(false)
            }}>Aceptar sugerencia</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle de cita */}
      <Modal open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Detalle de la cita</ModalTitle>
          </ModalHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <div className="font-bold mb-1">Información de la cita</div>
                <div><b>Fecha:</b> {selectedAppointment.date ? formatDateToSpanish(selectedAppointment.date) : "-"}</div>
                <div><b>Hora:</b> {selectedAppointment.time ? formatTimeTo12h(selectedAppointment.time) : "-"}</div>
                <div><b>Duración:</b> {selectedAppointment.duracion || selectedAppointment.duration || 30} min</div>
                <div><b>Tipo:</b> {selectedAppointment.tipo}</div>
                <div><b>Notas:</b> {selectedAppointment.notas || "Sin notas"}</div>
                <div><b>Estado:</b> {selectedAppointment.estado}</div>
              </div>
              <div>
                <div className="font-bold mb-1">Información del paciente</div>
                {patientInfo ? (
                  <>
                    <div><b>Nombre:</b> {patientInfo.name || "-"}</div>
                    <div><b>Tutor:</b> {patientInfo.guardian || "Sin tutor registrado"}</div>
                    <div><b>Edad:</b> {(patientInfo.age || patientInfo.edad ? `${patientInfo.age || patientInfo.edad} años` : "-")}</div>
                    <div><b>Teléfono:</b> {patientInfo.phone || "Sin teléfono"}</div>
                    <div><b>Teléfono secundario:</b> {patientInfo.additionalPhone || (patientInfo.additionalPhones?.[0] || "-")}</div>
                    <div><b>Correo:</b> {patientInfo.email || "-"}</div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">Cargando información del paciente...</div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                {selectedAppointment.estado !== "confirmada" && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={async () => {
                    await handleConfirmAppointment(selectedAppointment.id)
                    setShowInfoDialog(false)
                  }}>Confirmar</Button>
                )}
                {selectedAppointment.estado !== "confirmada" && (
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                    setShowEditAppointmentDialog(true)
                    setShowInfoDialog(false)
                    setSelectedAppointment(selectedAppointment)
                  }}>Editar</Button>
                )}
                {selectedAppointment.estado !== "cancelada" && (
                  <Button className="bg-red-600 hover:bg-red-700" onClick={async () => {
                    await handleEditAppointment({ ...selectedAppointment, estado: "cancelada", confirmed: false })
                    setShowInfoDialog(false)
                  }}>Cancelar</Button>
                )}
                <Button className="bg-gray-400 hover:bg-gray-500 text-black" onClick={() => setShowInfoDialog(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de edición de cita */}
      <Dialog open={showEditAppointmentDialog} onOpenChange={setShowEditAppointmentDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>Modifica los datos de la cita y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-date" className="text-right">Fecha *</Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-date"
                      type="date"
                      value={selectedAppointment.date || ""}
                      onChange={e => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-time" className="text-right">Hora *</Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-time"
                      type="time"
                      value={selectedAppointment.time || ""}
                      onChange={e => setSelectedAppointment({ ...selectedAppointment, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-duration" className="text-right">Duración</Label>
                  <div className="col-span-3">
                    <Select
                      value={selectedAppointment.duration?.toString()}
                      onValueChange={value => setSelectedAppointment({ ...selectedAppointment, duration: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar duración" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="90">1 hora 30 minutos</SelectItem>
                        <SelectItem value="240">4 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-type" className="text-right">Tipo *</Label>
                  <div className="col-span-3">
                    <Select
                      value={selectedAppointment.tipo}
                      onValueChange={value => setSelectedAppointment({ ...selectedAppointment, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consulta de valoración">Consulta de valoración</SelectItem>
                        <SelectItem value="Consulta subsecuente">Consulta subsecuente</SelectItem>
                        <SelectItem value="Consulta de 6 meses">Consulta de 6 meses</SelectItem>
                        <SelectItem value="Resinas">Resinas</SelectItem>
                        <SelectItem value="Extracción">Extracción</SelectItem>
                        <SelectItem value="Pulpotomía">Pulpotomía</SelectItem>
                        <SelectItem value="Pulpectomía">Pulpectomía</SelectItem>
                        <SelectItem value="Urgencia">Urgencia</SelectItem>
                        <SelectItem value="Toma de impresión">Toma de impresión</SelectItem>
                        <SelectItem value="Quirófano">Quirófano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-notes" className="text-right">Notas</Label>
                  <Textarea
                    id="edit-notes"
                    value={selectedAppointment.notas}
                    onChange={e => setSelectedAppointment({ ...selectedAppointment, notas: e.target.value })}
                    className="col-span-3"
                    placeholder="Notas adicionales sobre la cita"
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAppointmentDialog(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (selectedAppointment) {
                await handleEditAppointment(selectedAppointment)
                setShowEditAppointmentDialog(false)
              }
            }}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
