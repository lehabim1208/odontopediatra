"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
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
import { storage } from "@/lib/storage"
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
  parseISO,
  isWithinInterval,
  addMinutes,
  isAfter,
  startOfDay,
  isValid,
  isBefore,
} from "date-fns"
import { es } from "date-fns/locale"
import { useMediaQuery } from "@/hooks/use-media-query"

// Agregar la interfaz Appointment para incluir el campo confirmed
interface Appointment {
  id: number
  patientId: string
  patientName: string
  guardian?: string // Agregar campo para el tutor
  date: string
  time: string
  duration: number
  type: string
  notes: string
  confirmed?: boolean // Agregar campo para el estado de confirmación
}

// Actualizar los horarios del consultorio
const CLINIC_START_TIME = 9 // 9:00 AM
const CLINIC_END_TIME = 20.5 // 8:30 PM
const LUNCH_START = 13 // 1:00 PM
const LUNCH_END = 16.5 // 4:30 PM

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
  // Agregar un estado para evitar múltiples advertencias
  const [isProcessingWarning, setIsProcessingWarning] = useState(false)

  const [newAppointment, setNewAppointment] = useState<Appointment>({
    id: 0,
    patientId: "",
    patientName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration: 30,
    type: "Consulta de valoración",
    notes: "",
  })

  // Efecto para establecer la vista en "day" en dispositivos móviles
  useEffect(() => {
    if (isMobile && view !== "day") {
      setView("day")
    }
  }, [isMobile, view])

  // Modificar el useEffect para manejar la apertura del modal de cita cuando se navega desde la página de inicio
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const storedAppointments = storage.getItem("appointments")
      if (storedAppointments) {
        setAppointments(storedAppointments)
      }

      const storedPatients = storage.getItem("patients")
      if (storedPatients) {
        setPatients(storedPatients)
      }

      // Verificar si hay un ID de cita en la URL
      const appointmentId = searchParams.get("appointmentId")
      if (appointmentId && storedAppointments) {
        const appointment = storedAppointments.find((app: any) => app.id.toString() === appointmentId)
        if (appointment) {
          setSelectedAppointment(appointment)
          setShowInfoDialog(true)
        }
      }
    }, 2500) // Increased delay to 2.5 seconds

    return () => clearTimeout(timer) // Clear timeout if component unmounts
  }, [searchParams])

  // Modificar para guardar el ID del paciente en una referencia en lugar de usar la URL
  useEffect(() => {
    if (patientIdFromUrl) {
      patientIdRef.current = patientIdFromUrl

      const patients = storage.getItem("patients") || []
      const patient = patients.find((p: any) => p.id.toString() === patientIdFromUrl)

      if (patient) {
        setNewAppointment((prev) => ({
          ...prev,
          patientId: patientIdFromUrl,
          patientName: patient.name,
        }))
        setPatientSearchQuery(patient.name)
        setShowNewAppointmentDialog(true)

        // Limpiar la URL para evitar manipulación
        window.history.replaceState({}, document.title, "/citas")
      }
    }
  }, [patientIdFromUrl])

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

  // Check if time is within clinic hours (9am-1pm and 4:30pm-8:30pm)
  const isWithinClinicHours = (time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number)
    const hourDecimal = hours + minutes / 60

    return (
      (hourDecimal >= CLINIC_START_TIME && hourDecimal < LUNCH_START) ||
      (hourDecimal >= LUNCH_END && hourDecimal < CLINIC_END_TIME)
    )
  }

  const isAppointmentOverlap = (date: string, time: string, duration: number, excludeId?: number): boolean => {
    const newAppStart = parseISO(`${date}T${time}`)
    const newAppEnd = addMinutes(newAppStart, duration)

    return appointments.some((app) => {
      if (excludeId && app.id === excludeId) return false

      const appStart = parseISO(`${app.date}T${app.time}`)
      const appEnd = addMinutes(appStart, app.duration)
      return (
        isWithinInterval(newAppStart, { start: appStart, end: appEnd }) ||
        isWithinInterval(newAppEnd, { start: appStart, end: appEnd }) ||
        (newAppStart <= appStart && newAppEnd >= appEnd)
      )
    })
  }

  const findNextAvailableSlot = (date: string, time: string, duration: number): string => {
    let currentTime = parseISO(`${date}T${time}`)
    const endOfDay = parseISO(`${date}T${CLINIC_END_TIME}:00`)
    const lunchStart = parseISO(`${date}T${LUNCH_START}:00`)
    const lunchEnd = parseISO(`${date}T${LUNCH_END}:00`)

    while (currentTime < endOfDay) {
      // Skip lunch time
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

    // If no slot found today, check the next day
    const nextDay = addDays(parseISO(date), 1)
    return findNextAvailableSlot(format(nextDay, "yyyy-MM-dd"), `${CLINIC_START_TIME}:00`, duration)
  }

  const isTimeInPast = (date: string, time: string): boolean => {
    const appointmentDateTime = parseISO(`${date}T${time}`)
    const now = new Date()
    return isBefore(appointmentDateTime, now)
  }

  // Función para resetear el formulario de nueva cita
  const resetNewAppointmentForm = () => {
    setNewAppointment({
      id: 0,
      patientId: "",
      patientName: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      duration: 30,
      type: "Consulta de valoración",
      notes: "",
    })
    setPatientSearchQuery("")
    patientIdRef.current = null
  }

  // Modificar la función handleAddAppointment para incluir la información del tutor
  const handleAddAppointment = () => {
    // Evitar múltiples advertencias
    if (isProcessingWarning) return

    if (!newAppointment.patientId || !newAppointment.time || !newAppointment.type) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validate date is not in the past
    const appointmentDate = parseISO(newAppointment.date)
    if (!isValid(appointmentDate)) {
      toast({
        title: "Error",
        description: "La fecha seleccionada no es válida",
        variant: "destructive",
      })
      return
    }

    if (isAfter(startOfDay(new Date()), appointmentDate)) {
      toast({
        title: "Error",
        description: "No se pueden agendar citas en fechas pasadas",
        variant: "destructive",
      })
      return
    }

    // Check if the selected time is in the past
    if (isTimeInPast(newAppointment.date, newAppointment.time)) {
      setIsProcessingWarning(true)
      setWarningMessage("La hora seleccionada ya ha pasado. Por favor seleccione una hora futura.")
      setShowTimePassedWarning(true)
      return
    }

    // Validate time is within clinic hours
    if (!isWithinClinicHours(newAppointment.time)) {
      setIsProcessingWarning(true)
      setWarningMessage(`El horario debe estar entre 9:00-13:00 o 16:30-20:30. Por favor seleccione otro horario.`)
      setShowWarningDialog(true)
      return
    }

    if (isAppointmentOverlap(newAppointment.date, newAppointment.time, newAppointment.duration)) {
      const nextAvailable = findNextAvailableSlot(newAppointment.date, newAppointment.time, newAppointment.duration)
      setRecommendedTime(nextAvailable)
      setIsProcessingWarning(true)
      setWarningMessage(`La cita se superpone con otra existente. El próximo horario disponible es: ${nextAvailable}`)
      setShowWarningDialog(true)
      return
    }

    const newId = appointments.length > 0 ? Math.max(...appointments.map((a) => a.id)) + 1 : 1

    // Obtener información del tutor del paciente
    const patient = patients.find((p: any) => p.id.toString() === newAppointment.patientId)
    const guardianName = patient ? patient.guardian : ""

    const newAppointmentData: Appointment = {
      ...newAppointment,
      id: newId,
      guardian: guardianName, // Agregar el nombre del tutor
      confirmed: false, // Por defecto, la cita no está confirmada
    }

    const updatedAppointments = [...appointments, newAppointmentData]
    setAppointments(updatedAppointments)
    storage.setItem("appointments", updatedAppointments)

    // Actualizar la próxima cita del paciente
    updatePatientNextAppointment(newAppointment.patientId, newAppointment.date, newAppointment.time)

    // Resetear el formulario después de guardar
    resetNewAppointmentForm()

    setShowNewAppointmentDialog(false)
    setRecommendedTime(null)

    toast({
      title: "Éxito",
      description: "Cita agendada correctamente",
      variant: "success",
    })
  }

  const handleEditAppointment = () => {
    // Evitar múltiples advertencias
    if (isProcessingWarning) return

    if (!selectedAppointment) return

    // Check if the selected time is in the past
    if (isTimeInPast(selectedAppointment.date, selectedAppointment.time)) {
      setIsProcessingWarning(true)
      setWarningMessage("La hora seleccionada ya ha pasado. Por favor seleccione una hora futura.")
      setShowTimePassedWarning(true)
      return
    }

    // Validate time is within clinic hours
    if (!isWithinClinicHours(selectedAppointment.time)) {
      toast({
        title: "Error",
        description: "El horario debe estar entre 9:00-13:00 o 16:30-20:30",
        variant: "destructive",
      })
      return
    }

    // Check for overlap with other appointments (excluding this one)
    if (
      isAppointmentOverlap(
        selectedAppointment.date,
        selectedAppointment.time,
        selectedAppointment.duration,
        selectedAppointment.id,
      )
    ) {
      toast({
        title: "Error",
        description: "La cita se superpone con otra existente",
        variant: "destructive",
      })
      return
    }

    const updatedAppointments = appointments.map((appointment) =>
      appointment.id === selectedAppointment.id ? selectedAppointment : appointment,
    )

    setAppointments(updatedAppointments)
    storage.setItem("appointments", updatedAppointments)

    // Actualizar la próxima cita del paciente
    updatePatientNextAppointment(selectedAppointment.patientId, selectedAppointment.date, selectedAppointment.time)

    setShowEditAppointmentDialog(false)

    toast({
      title: "Éxito",
      description: "Cita actualizada correctamente",
      variant: "success",
    })
  }

  const handleCancelAppointment = (id: number) => {
    if (confirm("¿Está seguro de que desea cancelar esta cita?")) {
      // Obtener la cita antes de eliminarla
      const appointmentToCancel = appointments.find((app) => app.id === id)

      const updatedAppointments = appointments.filter((appointment) => appointment.id !== id)
      setAppointments(updatedAppointments)
      storage.setItem("appointments", updatedAppointments)

      // Si encontramos la cita, actualizar la próxima cita del paciente
      if (appointmentToCancel) {
        updatePatientNextAppointmentAfterCancel(appointmentToCancel.patientId)
      }

      toast({
        title: "Éxito",
        description: "Cita cancelada correctamente",
        variant: "success",
      })
    }
  }

  const updatePatientNextAppointment = (patientId: string, date: string, time: string) => {
    const patients = storage.getItem("patients") || []
    const formattedDate = format(parseISO(`${date}T${time}`), "d 'de' MMMM, yyyy HH:mm", { locale: es })

    const updatedPatients = patients.map((patient: any) => {
      if (patient.id.toString() === patientId) {
        // Obtener todas las citas futuras de este paciente
        const patientAppointments = appointments
          .filter((app) => app.patientId === patientId)
          .filter((app) => {
            const appDate = parseISO(`${app.date}T${app.time}`)
            return isAfter(appDate, new Date())
          })
          .sort((a, b) => {
            const dateA = parseISO(`${a.date}T${a.time}`)
            const dateB = parseISO(`${b.date}T${b.time}`)
            return dateA.getTime() - dateB.getTime()
          })

        // Si hay citas futuras, usar la más próxima
        if (patientAppointments.length > 0) {
          const nextApp = patientAppointments[0]
          const nextAppDate = format(parseISO(`${nextApp.date}T${nextApp.time}`), "d 'de' MMMM, yyyy HH:mm", {
            locale: es,
          })
          return { ...patient, nextVisit: nextAppDate }
        }

        // Si no hay otras citas, usar la que acabamos de agregar/editar
        return { ...patient, nextVisit: formattedDate }
      }
      return patient
    })

    storage.setItem("patients", updatedPatients)
  }

  const updatePatientNextAppointmentAfterCancel = (patientId: string) => {
    const patients = storage.getItem("patients") || []

    const updatedPatients = patients.map((patient: any) => {
      if (patient.id.toString() === patientId) {
        // Obtener todas las citas futuras de este paciente
        const patientAppointments = appointments
          .filter((app) => app.patientId === patientId && app.id !== (selectedAppointment?.id || 0))
          .filter((app) => {
            const appDate = parseISO(`${app.date}T${app.time}`)
            return isAfter(appDate, new Date())
          })
          .sort((a, b) => {
            const dateA = parseISO(`${a.date}T${a.time}`)
            const dateB = parseISO(`${b.date}T${b.time}`)
            return dateA.getTime() - dateB.getTime()
          })

        // Si hay citas futuras, usar la más próxima
        if (patientAppointments.length > 0) {
          const nextApp = patientAppointments[0]
          const nextAppDate = format(parseISO(`${nextApp.date}T${nextApp.time}`), "d 'de' MMMM, yyyy HH:mm", {
            locale: es,
          })
          return { ...patient, nextVisit: nextAppDate }
        }

        // Si no hay otras citas, marcar como pendiente
        return { ...patient, nextVisit: "Pendiente" }
      }
      return patient
    })

    storage.setItem("patients", updatedPatients)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowInfoDialog(true)
  }

  // Agregar función para confirmar cita
  const handleConfirmAppointment = () => {
    if (!selectedAppointment) return

    const updatedAppointment = {
      ...selectedAppointment,
      confirmed: true,
    }

    const updatedAppointments = appointments.map((appointment) =>
      appointment.id === selectedAppointment.id ? updatedAppointment : appointment,
    )

    setAppointments(updatedAppointments)
    storage.setItem("appointments", updatedAppointments)
    setSelectedAppointment(updatedAppointment)

    toast({
      title: "Éxito",
      description: "Cita confirmada correctamente",
      variant: "success",
    })
  }

  // Modificarr el componente WeekView para mostrar las citas confirmadas en verde
  const WeekView = () => {
    const weekDays = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    })
    const timeSlots = Array.from({ length: (CLINIC_END_TIME - CLINIC_START_TIME) * 4 }, (_, i) => {
      const hour = Math.floor(i / 4) + CLINIC_START_TIME
      const minute = (i % 4) * 15
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    })

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="border p-2 w-20 sticky left-0 bg-background z-10">Hora</th>
              {weekDays.map((day) => (
                <th key={day.toString()} className="border p-2 min-w-[120px]">
                  {format(day, "EEEE", { locale: es })}
                  <br />
                  {format(day, "d MMM", { locale: es })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, index) => {
              const isQuarterHour = index % 4 === 0
              const isLunchTime =
                time.startsWith("13:") ||
                time.startsWith("14:") ||
                time.startsWith("15:") ||
                (time.startsWith("16:") && time <= "16:30")

              return (
                <tr
                  key={time}
                  className={`${isQuarterHour ? "border-t border-gray-300" : ""} ${isLunchTime ? "bg-gray-300 dark:bg-gray-700" : ""}`}
                >
                  {isQuarterHour && (
                    <td className="border-r p-1 text-sm font-semibold sticky left-0 bg-background z-10" rowSpan={4}>
                      {time}
                    </td>
                  )}
                  {weekDays.map((day) => {
                    const appointmentsForSlot = appointments.filter(
                      (app) => app.date === format(day, "yyyy-MM-dd") && app.time === time,
                    )
                    return (
                      <td key={day.toString()} className="border-r p-1 relative" style={{ height: "20px" }}>
                        {appointmentsForSlot.map((app) => {
                          const durationInSlots = app.duration / 15
                          return (
                            <div
                              key={app.id}
                              className={`absolute left-0 right-0 ${app.confirmed ? "bg-green-600" : "bg-primary"} text-primary-foreground p-1 rounded-lg text-xs md:text-sm overflow-hidden cursor-pointer hover:${app.confirmed ? "bg-green-700" : "bg-primary/90"} transition-colors`}
                              style={{
                                top: "0",
                                height: `${durationInSlots * 20}px`,
                                zIndex: 10,
                              }}
                              onClick={() => handleAppointmentClick(app)}
                            >
                              <div className="truncate">
                                {app.patientName} - {app.type}
                              </div>
                            </div>
                          )
                        })}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Modificar el componente DayView para mostrar las citas confirmadas en verde
  const DayView = () => {
    const timeSlots = Array.from({ length: (CLINIC_END_TIME - CLINIC_START_TIME) * 4 }, (_, i) => {
      const hour = Math.floor(i / 4) + CLINIC_START_TIME
      const minute = (i % 4) * 15
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    })
    const dayAppointments = appointments.filter((app) => app.date === format(currentDate, "yyyy-MM-dd"))

    return (
      <div className="space-y-1">
        {timeSlots.map((time, index) => {
          const appointmentsForSlot = dayAppointments.filter((app) => app.time === time)
          const isQuarterHour = index % 4 === 0
          const isLunchTime =
            time.startsWith("13:") ||
            time.startsWith("14:") ||
            time.startsWith("15:") ||
            (time.startsWith("16:") && time <= "16:30")

          return (
            <div
              key={time}
              className={`flex border-b py-1 ${isQuarterHour ? "border-gray-300" : "border-gray-100"} ${isLunchTime ? "bg-gray-300 dark:bg-gray-700" : ""}`}
            >
              {isQuarterHour && <div className="w-20 font-semibold text-sm">{time}</div>}
              {!isQuarterHour && <div className="w-20"></div>}
              <div className="flex-1 relative">
                {appointmentsForSlot.map((app) => {
                  const durationInSlots = app.duration / 15
                  return (
                    <div
                      key={app.id}
                      className={`absolute left-0 right-0 ${app.confirmed ? "bg-green-600" : "bg-primary"} text-primary-foreground p-1 rounded-lg text-sm overflow-hidden cursor-pointer hover:${app.confirmed ? "bg-green-700" : "bg-primary/90"} transition-colors`}
                      style={{
                        top: "0",
                        height: `${durationInSlots * 100}%`,
                        zIndex: 10,
                      }}
                      onClick={() => handleAppointmentClick(app)}
                    >
                      {app.patientName} - {app.type}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Modificar el componente MonthView para mostrar las citas confirmadas en verde
  const MonthView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
    const endDate = addDays(startDate, 34) // 5 weeks
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayAppointments = appointments.filter((app) => app.date === format(day, "yyyy-MM-dd"))
          return (
            <div key={day.toString()} className={`border p-2 ${isSameDay(day, new Date()) ? "bg-muted" : ""}`}>
              <div className="text-right">{format(day, "d")}</div>
              {dayAppointments.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className={`text-xs truncate ${app.confirmed ? "bg-green-500/10" : "bg-primary/10"} p-1 rounded-md mb-1 cursor-pointer hover:${app.confirmed ? "bg-green-500/20" : "bg-primary/20"}`}
                  onClick={() => handleAppointmentClick(app)}
                >
                  {app.time} {app.patientName}
                </div>
              ))}
              {dayAppointments.length > 3 && (
                <div className="text-xs text-muted-foreground">+{dayAppointments.length - 3} más</div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const WarningDialog = () => (
    <Dialog
      open={showWarningDialog}
      onOpenChange={(open) => {
        setShowWarningDialog(open)
        if (!open) setIsProcessingWarning(false)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Advertencia</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{warningMessage}</p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setShowWarningDialog(false)
              setIsProcessingWarning(false)
            }}
          >
            Cerrar
          </Button>
          {recommendedTime && (
            <Button
              onClick={() => {
                setNewAppointment((prev) => ({ ...prev, time: recommendedTime }))
                setShowWarningDialog(false)
                setIsProcessingWarning(false)
                setShowNewAppointmentDialog(true) // Reabre el modal de nueva cita
              }}
            >
              Usar horario recomendado
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const TimePassedWarningDialog = () => (
    <Dialog
      open={showTimePassedWarning}
      onOpenChange={(open) => {
        setShowTimePassedWarning(open)
        if (!open) setIsProcessingWarning(false)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hora no válida</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>{warningMessage}</p>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setShowTimePassedWarning(false)
              setIsProcessingWarning(false)
            }}
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const updateMinTime = (date: string) => {
    if (isSameDay(parseISO(date), new Date())) {
      setMinTime(format(new Date(), "HH:mm"))
    } else {
      setMinTime("09:00")
    }
  }

  // Modificar el diálogo de información de cita para incluir la información del tutor y el botón de confirmar
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
            // Resetear el formulario cuando se cierra el modal
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
              {/* Modificar la parte donde se muestra el selector de fecha y hora */}
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
                        // Cuando se escribe, mostrar la lista de pacientes filtrados
                        setShowPatientDropdown(e.target.value.length > 0)
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
                                  patientId: patient.id.toString(),
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
                  {newAppointment.patientId && (
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const patient = patients.find((p: any) => p.id.toString() === newAppointment.patientId)
                        if (patient) {
                          return (
                            <>
                              <span>Tutor: {patient.guardian}</span>
                              {patient.phone && <span className="ml-2 text-gray-400">• Tel: {patient.phone}</span>}
                            </>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
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
                    value={newAppointment.date}
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
                    value={newAppointment.time}
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
                    value={newAppointment.duration.toString()}
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
                    value={newAppointment.type}
                    onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}
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
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
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
            <Button onClick={handleAddAppointment}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditAppointmentDialog} onOpenChange={setShowEditAppointmentDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Modifique los detalles de la cita. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <ScrollArea className="max-h-[calc(90vh-180px)]">
              <div className="grid gap-4 py-4 pr-4">
                {/* Agregar la misma modificación para el diálogo de edición */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-date" className="text-right">
                    Fecha *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-date"
                      type="date"
                      value={selectedAppointment.date}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => setSelectedAppointment({ ...selectedAppointment, date: e.target.value })}
                      required
                      className="date-input"
                      autoFocus={false}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-time" className="text-right">
                    Hora *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="edit-time"
                      type="time"
                      value={selectedAppointment.time}
                      min={isSameDay(parseISO(selectedAppointment.date), new Date()) ? minTime : "09:00"}
                      max="20:30"
                      onChange={(e) => setSelectedAppointment({ ...selectedAppointment, time: e.target.value })}
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
                  <Label htmlFor="edit-duration" className="text-right">
                    Duración
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={selectedAppointment.duration.toString()}
                      onValueChange={(value) =>
                        setSelectedAppointment({ ...selectedAppointment, duration: Number.parseInt(value) })
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
                  <Label htmlFor="edit-type" className="text-right">
                    Tipo *
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={selectedAppointment.type}
                      onValueChange={(value) => setSelectedAppointment({ ...selectedAppointment, type: value })}
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
                  <Label htmlFor="edit-notes" className="text-right">
                    Notas
                  </Label>
                  <Textarea
                    id="edit-notes"
                    value={selectedAppointment.notes}
                    onChange={(e) => setSelectedAppointment({ ...selectedAppointment, notes: e.target.value })}
                    className="col-span-3"
                    placeholder="Notas adicionales sobre la cita"
                    autoFocus={false}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAppointmentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAppointment}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="max-h-[calc(90vh-180px)] overflow-y-auto pr-4 custom-scrollbar">
              <div className="space-y-6 p-1">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Información de la Cita</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="font-semibold">Fecha:</Label>
                      <p>{format(parseISO(selectedAppointment.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Hora:</Label>
                      <p>{selectedAppointment.time}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Duración:</Label>
                      <p>{selectedAppointment.duration} minutos</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Tipo:</Label>
                      <p>{selectedAppointment.type}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Estado:</Label>
                      <p
                        className={
                          selectedAppointment.confirmed ? "text-green-600 font-medium" : "text-amber-600 font-medium"
                        }
                      >
                        {selectedAppointment.confirmed ? "Confirmada" : "Pendiente de confirmación"}
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Notas:</Label>
                      <p>{selectedAppointment.notes || "Sin notas adicionales"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Información del Paciente</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="font-semibold">Paciente:</Label>
                      <p>{selectedAppointment.patientName}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Tutor:</Label>
                      <p>{selectedAppointment.guardian || "No especificado"}</p>
                    </div>

                    {/* Obtenemos la información de contacto del paciente */}
                    {(() => {
                      const patients = storage.getItem("patients") || []
                      const patient = patients.find((p: any) => p.id.toString() === selectedAppointment.patientId)

                      if (patient) {
                        return (
                          <>
                            {patient.phone && (
                              <div>
                                <Label className="font-semibold">Teléfono principal:</Label>
                                <p>{patient.phone}</p>
                              </div>
                            )}
                            {patient.additionalPhones && patient.additionalPhones.length > 0 && (
                              <div>
                                <Label className="font-semibold">Teléfono adicional:</Label>
                                <p>{patient.additionalPhones.join(", ")}</p>
                              </div>
                            )}
                            {patient.email && (
                              <div>
                                <Label className="font-semibold">Correo electrónico:</Label>
                                <p>{patient.email}</p>
                              </div>
                            )}
                          </>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
              Cerrar
            </Button>
            {selectedAppointment && !selectedAppointment.confirmed && (
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleConfirmAppointment}>
                Confirmar Cita
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => {
                setShowInfoDialog(false)
                setSelectedAppointment(selectedAppointment)
                setShowEditAppointmentDialog(true)
              }}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedAppointment) {
                  handleCancelAppointment(selectedAppointment.id)
                  setShowInfoDialog(false)
                }
              }}
            >
              Cancelar Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <WarningDialog />

      {/* Time Passed Warning Dialog */}
      <TimePassedWarningDialog />
    </div>
  )
}
