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
import { toZonedTime } from "date-fns-tz"
import 'animate.css';

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

// Utilidad para validar si el horario es múltiplo de 15 minutos
function isValidTimeInterval(time: string) {
  if (!time) return false;
  const [h, m] = time.split(":").map(Number);
  return m % 15 === 0;
}

// Utilidad para saber si es domingo considerando zona horaria de México
function isSunday(date: string) {
  if (!date) return false;
  // Considerar la zona horaria de México
  const timeZone = "America/Mexico_City";
  // date puede venir como YYYY-MM-DD
  const [year, month, day] = date.split("-").map(Number);
  // Crear fecha a las 12:00 para evitar desfases por horario de verano
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // toZonedTime en date-fns-tz v3.x espera (date, timeZone), regresa un Date en la zona indicada
  const zonedDate = toZonedTime(utcDate, timeZone);
  // getDay() devuelve 0 para domingo
  return zonedDate.getDay() === 0;
}

// Utilidad para saber si está en horario de comida
function isLunchTime(time: string) {
  if (!time) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const hourDecimal = hours + minutes / 60;
  return hourDecimal >= LUNCH_START && hourDecimal < LUNCH_END;
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
    duration: 30, // <-- add this for UI logic
    notas: "",
    estado: "pendiente",
  })

  const [showLunchWarning, setShowLunchWarning] = useState(false);
  const [showSundayWarning, setShowSundayWarning] = useState(false);
  const [showDurationWarning, setShowDurationWarning] = useState(false);
  const [recommendedDuration, setRecommendedDuration] = useState<number | null>(null);

  // Nuevo estado para saber a qué modal pertenece la sugerencia
  const [suggestionTarget, setSuggestionTarget] = useState<'edit' | 'new' | null>(null);

  // Opciones válidas de duración (en minutos)
  const DURATION_OPTIONS = [15, 30, 60, 90, 240];

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
        data
          .filter((cita: any) => cita.estado !== "cancelada") // <-- Filtrar canceladas
          .map((cita: any) => {
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
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

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

  useEffect(() => {
    // Leer paciente desde sessionStorage (no desde la URL)
    if (typeof window !== 'undefined') {
      const patientId = sessionStorage.getItem('selectedPatientId')
      const patientName = sessionStorage.getItem('selectedPatientName')
      if (patientId && patientName) {
        setNewAppointment((prev) => ({
          ...prev,
          paciente_id: parseInt(patientId),
          patientName: patientName,
        }))
        setPatientSearchQuery(patientName)
        setShowNewAppointmentDialog(true)
        sessionStorage.removeItem('selectedPatientId')
        sessionStorage.removeItem('selectedPatientName')
      }
    }
  }, [])

  // Abrir modal de detalle de cita si hay un id en localStorage (desde inicio)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAppointmentId = window.localStorage.getItem('selectedAppointmentId')
      if (storedAppointmentId && appointments.length > 0) {
        const appointment = appointments.find(app => app.id.toString() === storedAppointmentId)
        if (appointment) {
          setSelectedAppointment(appointment)
          setShowInfoDialog(true)
        }
        window.localStorage.removeItem('selectedAppointmentId')
      }
    }
  }, [appointments])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.localStorage.getItem('openNewAppointmentModal') === '1') {
        setShowNewAppointmentDialog(true)
        window.localStorage.removeItem('openNewAppointmentModal')
      }
    }
  }, [])

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

  const findNextAvailableSlot = (date: string, _time: string, duration: number): string | null => {
    // Genera todos los slots posibles del día
    const slots: string[] = [];
    for (let h = CLINIC_START_TIME; h < CLINIC_END_TIME; h += 0.5) {
      const hour = Math.floor(h);
      const min = h % 1 === 0 ? "00" : "30";
      slots.push(`${hour.toString().padStart(2, "0")}:${min}`);
    }
    const lunchStart = getLocalDate(date, `${LUNCH_START}:00`);
    const lunchEnd = getLocalDate(date, `${LUNCH_END}:00`);
    for (const slot of slots) {
      const slotStart = getLocalDate(date, slot);
      const slotEnd = addMinutes(slotStart, duration);
      // Salta si el slot está en horario de comida
      if (isWithinInterval(slotStart, { start: lunchStart, end: lunchEnd })) continue;
      // Salta si el slot no está dentro del horario de clínica
      if (!isWithinClinicHours(slot)) continue;
      // Verifica solapamiento: el rango completo del slot no debe chocar con ninguna cita
      const overlap = appointments.some(app => {
        if (app.estado === "cancelada" || app.date !== date) return false;
        const appStart = getLocalDate(app.date!, app.time!);
        const appEnd = addMinutes(appStart, Number(app.duracion || app.duration || 30));
        // Checa si hay intersección entre [slotStart, slotEnd) y [appStart, appEnd)
        return slotStart < appEnd && slotEnd > appStart;
      });
      if (!overlap) {
        return slot;
      }
    }
    return null; // No hay slots disponibles
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
      duration: 30, // <-- reset both
      notas: "",
      estado: "pendiente",
    })
    setPatientSearchQuery("")
    patientIdRef.current = null
  }

  const [appointmentAnimations, setAppointmentAnimations] = useState<Record<number, string>>({});

  // Helper para animar cita
  const triggerAnimation = (id: number, animation: string) => {
    setAppointmentAnimations((prev) => ({ ...prev, [id]: animation }));
    setTimeout(() => {
      setAppointmentAnimations((prev) => {
        // Solo limpia si la animación no es fadeOutUp (para cancelar, se limpia tras fetchAppointments)
        if (animation === 'animate__fadeOutUp') return prev;
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }, 1000); // Duración estándar de animate.css
  };

  const handleAddAppointment = async (appointmentData: Partial<Appointment>) => {
    // Debug: log incoming data
    console.log('handleAddAppointment called with:', appointmentData);
    // Log all relevant fields for debugging
    console.log('paciente_id:', appointmentData.paciente_id, 'date:', appointmentData.date, 'time:', appointmentData.time, 'duration:', appointmentData.duration, 'tipo:', appointmentData.tipo);
    // Extra validation for paciente_id
    if (!appointmentData.paciente_id || isNaN(Number(appointmentData.paciente_id)) || Number(appointmentData.paciente_id) <= 0) {
      toast({
        title: "Campos obligatorios faltantes",
        description: "Por favor, seleccione un paciente válido.",
        variant: "destructive",
      });
      return;
    }
    // Correct required fields validation (must use 'duration', not 'duracion')
    if (!appointmentData.paciente_id || !appointmentData.date || !appointmentData.time || (appointmentData.duration === undefined || appointmentData.duration === null || isNaN(Number(appointmentData.duration))) || !appointmentData.tipo) {
      toast({
        title: "Campos obligatorios faltantes",
        description: "Por favor, complete todos los campos requeridos: paciente, fecha, hora, duración y tipo.",
        variant: "destructive",
      });
      return;
    }
    // Asegura que duration siempre sea un número
    const duration = Number(appointmentData.duration || 30);
    // Validar domingo (permitir solo si es urgencia)
    if (isSunday(appointmentData.date!) && appointmentData.tipo !== "Urgencia") {
      setShowSundayWarning(true);
      return;
    }
    // Validar horario de comida (excepto urgencia)
    if (
      appointmentData.tipo !== "Urgencia" &&
      isLunchTime(appointmentData.time!)
    ) {
      setShowLunchWarning(true);
      return;
    }
    // Validar que la hora sea múltiplo de 15 min
    if (!isValidTimeInterval(appointmentData.time!)) {
      toast({
        title: "Hora inválida",
        description: "Solo puedes agendar citas en intervalos de 15 minutos (ejemplo: 10:00, 10:15, 10:30)",
        variant: "destructive",
      });
      return;
    }
    // Validar que no sea en el pasado (hoy)
    if (isTimeInPast(appointmentData.date!, appointmentData.time!)) {
      toast({
        title: "Hora o fecha inválida",
        description: "No puedes agendar una cita en el pasado.",
        variant: "destructive",
      });
      return;
    }
    // Validar que esté dentro del horario de atención
    const [h, m] = appointmentData.time!.split(":").map(Number);
    const hourDecimal = h + m / 60;
    if (hourDecimal < CLINIC_START_TIME || hourDecimal > CLINIC_END_TIME) {
      toast({
        title: "Fuera de horario",
        description: "Solo puedes agendar citas entre 9:00 AM y 8:30 PM.",
        variant: "destructive",
      });
      return;
    }
    // Validar solapamiento: solo permitir si la cita inicia cuando termina otra, no antes
    const newAppStart = getLocalDate(appointmentData.date!, appointmentData.time!);
    const newAppEnd = addMinutes(newAppStart, duration);
    const overlap = appointments.some((app) => {
      if (app.estado === "cancelada" || app.date !== appointmentData.date) return false;
      const appStart = getLocalDate(app.date!, app.time!);
      const appEnd = addMinutes(appStart, Number(app.duracion || app.duration || 30));
      // Permitir si la nueva cita inicia exactamente cuando termina la anterior
      // No permitir si se solapan
      return (
        (newAppStart < appEnd && newAppEnd > appStart)
      );
    });
    if (overlap) {
      // Calcular próxima hora disponible
      const nextTime = findNextAvailableSlot(appointmentData.date!, appointmentData.time!, duration);
      // Calcular duración máxima posible en el horario seleccionado (en el mismo horario)
      let maxDuration = null;
      for (let d of DURATION_OPTIONS.filter(opt => opt < duration).sort((a, b) => b - a)) {
        // Si en el mismo horario hay espacio para una duración menor
        const slotStart = getLocalDate(appointmentData.date!, appointmentData.time!);
        const slotEnd = addMinutes(slotStart, d);
        const lunchStart = getLocalDate(appointmentData.date!, `${LUNCH_START}:00`);
        const lunchEnd = getLocalDate(appointmentData.date!, `${LUNCH_END}:00`);
        // Salta si el slot está en horario de comida
        if (isWithinInterval(slotStart, { start: lunchStart, end: lunchEnd })) continue;
        // Salta si el slot no está dentro del horario de clínica
        if (!isWithinClinicHours(appointmentData.time!)) continue;
        // Verifica solapamiento: el rango completo del slot no debe chocar con ninguna cita
        const overlapDur = appointments.some(app => {
          if (app.estado === "cancelada" || app.date !== appointmentData.date || app.id === appointmentData.id) return false;
          const appStart = getLocalDate(app.date!, app.time!);
          const appEnd = addMinutes(appStart, Number(app.duracion || app.duration || 30));
          return slotStart < appEnd && slotEnd > appStart;
        });
        if (!overlapDur) {
          maxDuration = d;
          break;
        }
      }
      if (nextTime && maxDuration) {
        setRecommendedTime(nextTime);
        setRecommendedDuration(maxDuration);
        setWarningMessage("El horario seleccionado choca con otra cita. Puedes elegir la próxima hora disponible o reducir la duración para agendar en este horario.");
        setSuggestionTarget('new');
        setShowWarningDialog(true);
      } else if (nextTime) {
        setRecommendedTime(nextTime);
        setRecommendedDuration(null);
        setWarningMessage("El horario seleccionado choca con otra cita. Te sugerimos la próxima hora disponible.");
        setSuggestionTarget('new');
        setShowWarningDialog(true);
      } else if (maxDuration) {
        setRecommendedTime(null);
        setRecommendedDuration(maxDuration);
        setWarningMessage("La duración seleccionada choca con otra cita. Te sugerimos una duración menor para este horario.");
        setSuggestionTarget('new');
        setShowWarningDialog(true);
      } else {
        setRecommendedTime(null);
        setRecommendedDuration(null);
        setWarningMessage("No hay espacio disponible para la duración y horario seleccionados. Intenta con otro horario o duración.");
        setSuggestionTarget('new');
        setShowWarningDialog(true);
      }
      return;
    }
    // Validar que la cita termine dentro del horario de atención y no cruce horario de comida (excepto urgencia)
    const endDuration = Number(appointmentData.duration || 30);
    const newAppStartDecimal = parseFloat((`${appointmentData.time!.split(":")[0]}.${appointmentData.time!.split(":")[1]}`));
    const newAppEndDecimal = newAppStartDecimal + endDuration / 60;
    // Validar que no termine después del horario de atención
    if (newAppEndDecimal > CLINIC_END_TIME) {
      // Recomendar duración máxima posible
      const maxDuration = Math.floor((CLINIC_END_TIME - newAppStartDecimal) * 60 / 15) * 15;
      const rawMaxDuration = Math.floor((CLINIC_END_TIME - newAppStartDecimal) * 60);
      const minDropdown = Math.min(...DURATION_OPTIONS);
      const suggestedDuration = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration).pop() || null;
      setRecommendedDuration(suggestedDuration && suggestedDuration >= minDropdown ? suggestedDuration : null);
      setWarningMessage("La duración seleccionada hace que la cita termine fuera del horario de atención. Te sugerimos una duración menor.");
      setSuggestionTarget('new');
      setShowDurationWarning(true);
      return;
    }
    // Validar que no cruce horario de comida (excepto urgencia)
    if (appointmentData.tipo !== "Urgencia") {
      const lunchStart = getLocalDate(appointmentData.date!, `${LUNCH_START}:00`);
      const lunchEnd = getLocalDate(appointmentData.date!, `${LUNCH_END}:00`);
      if (
        (newAppStart < lunchEnd && newAppEnd > lunchStart)
      ) {
        // Recomendar duración máxima posible antes de comida
        let maxEnd = Math.min(LUNCH_START, CLINIC_END_TIME);
        const appointmentEndDecimal = hourDecimal + endDuration / 60;
        if (hourDecimal < LUNCH_START && appointmentEndDecimal > LUNCH_START) {
          // Calcular minutos hasta el inicio de comida
          const minutesToLunch = (LUNCH_START * 60) - (hourDecimal * 60);
          const rawMaxDuration = Math.floor(minutesToLunch / 15) * 15;
          const minDropdown = Math.min(...DURATION_OPTIONS);
          const suggestedDuration = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration).pop() || null;
          setRecommendedDuration(suggestedDuration && suggestedDuration >= minDropdown ? suggestedDuration : null);
        } else if (hourDecimal >= LUNCH_END) {
          // Después de comida, sugerir hasta fin de jornada
          const minutesToEnd = (CLINIC_END_TIME * 60) - (hourDecimal * 60);
          const rawMaxDuration2 = Math.floor(minutesToEnd / 15) * 15;
          const minDropdown = Math.min(...DURATION_OPTIONS);
          const suggestedDuration2 = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration2).pop() || null;
          setRecommendedDuration(suggestedDuration2 && suggestedDuration2 >= minDropdown ? suggestedDuration2 : null);
        } else {
          setRecommendedDuration(null);
        }
        setWarningMessage("La duración seleccionada hace que la cita cruce el horario de comida. Te sugerimos una duración menor.");
        setShowDurationWarning(true);
        return;
      }
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
      const newCita = await res.json();
      fetchAppointments();
      setShowNewAppointmentDialog(false);
      resetNewAppointmentForm();
      toast({ title: "Éxito", description: "Cita agendada correctamente", variant: "success" });
      if (newCita && newCita.id) {
        triggerAnimation(newCita.id, 'animate__fadeInUp');
      }
    } else {
      toast({ title: "Error", description: "No se pudo agendar la cita", variant: "destructive" });
    }
  }

  // Cambia la firma para devolver un booleano
  const handleEditAppointment = async (appointmentData: Appointment): Promise<boolean> => {
    // Validar que todos los campos obligatorios estén llenos
    if (!appointmentData.paciente_id || !appointmentData.date || !appointmentData.time || (!appointmentData.duration && appointmentData.duration !== 0) || !appointmentData.tipo) {
      toast({
        title: "Campos obligatorios faltantes",
        description: "Por favor, complete todos los campos requeridos: paciente, fecha, hora, duración y tipo.",
        variant: "destructive",
      });
      return false;
    }
    // Asegura que duration siempre sea un número
    const duration = Number(appointmentData.duration || 30);
    // Validar domingo (permitir solo si es urgencia)
    if (isSunday(appointmentData.date!) && appointmentData.tipo !== "Urgencia") {
      setShowSundayWarning(true);
      return false;
    }
    // Validar horario de comida (excepto urgencia)
    if (
      appointmentData.tipo !== "Urgencia" &&
      isLunchTime(appointmentData.time!)
    ) {
      setShowLunchWarning(true);
      return false;
    }
    // Validar que la hora sea múltiplo de 15 min
    if (!isValidTimeInterval(appointmentData.time!)) {
      toast({
        title: "Hora inválida",
        description: "Solo puedes agendar citas en intervalos de 15 minutos (ejemplo: 10:00, 10:15, 10:30)",
        variant: "destructive",
      });
      return false;
    }
    // Validar que no sea en el pasado (hoy)
    if (isTimeInPast(appointmentData.date!, appointmentData.time!)) {
      toast({
        title: "Hora o fecha inválida",
        description: "No puedes agendar una cita en el pasado.",
        variant: "destructive",
      });
      return false;
    }
    // Validar que esté dentro del horario de atención
    const [h, m] = appointmentData.time!.split(":").map(Number);
    const hourDecimal = h + m / 60;
    if (hourDecimal < CLINIC_START_TIME || hourDecimal > CLINIC_END_TIME) {
      toast({
        title: "Fuera de horario",
        description: "Solo puedes agendar citas entre 9:00 AM y 8:30 PM.",
        variant: "destructive",
      });
      return false;
    }
    // Validar solapamiento: solo permitir si la cita inicia cuando termina otra, no antes
    const newAppStart = getLocalDate(appointmentData.date!, appointmentData.time!);
    const newAppEnd = addMinutes(newAppStart, duration);
    const overlap = appointments.some((app) => {
      if (app.estado === "cancelada" || app.date !== appointmentData.date || app.id === appointmentData.id) return false;
      const appStart = getLocalDate(app.date!, app.time!);
      const appEnd = addMinutes(appStart, Number(app.duracion || app.duration || 30));
      return (
        (newAppStart < appEnd && newAppEnd > appStart)
      );
    });
    if (overlap) {
      // Calcular próxima hora disponible
      const nextTime = findNextAvailableSlot(appointmentData.date!, appointmentData.time!, duration);
      // Calcular duración máxima posible en el horario seleccionado (en el mismo horario)
      let maxDuration = null;
      for (let d of DURATION_OPTIONS.filter(opt => opt < duration).sort((a, b) => b - a)) {
        // Si en el mismo horario hay espacio para una duración menor
        const slotStart = getLocalDate(appointmentData.date!, appointmentData.time!);
        const slotEnd = addMinutes(slotStart, d);
        const lunchStart = getLocalDate(appointmentData.date!, `${LUNCH_START}:00`);
        const lunchEnd = getLocalDate(appointmentData.date!, `${LUNCH_END}:00`);
        // Salta si el slot está en horario de comida
        if (isWithinInterval(slotStart, { start: lunchStart, end: lunchEnd })) continue;
        // Salta si el slot no está dentro del horario de clínica
        if (!isWithinClinicHours(appointmentData.time!)) continue;
        // Verifica solapamiento: el rango completo del slot no debe chocar con ninguna cita
        const overlapDur = appointments.some(app => {
          if (app.estado === "cancelada" || app.date !== appointmentData.date || app.id === appointmentData.id) return false;
          const appStart = getLocalDate(app.date!, app.time!);
          const appEnd = addMinutes(appStart, Number(app.duracion || app.duration || 30));
          return slotStart < appEnd && slotEnd > appStart;
        });
        if (!overlapDur) {
          maxDuration = d;
          break;
        }
      }
      if (nextTime && maxDuration) {
        setRecommendedTime(nextTime);
        setRecommendedDuration(maxDuration);
        setWarningMessage("El horario seleccionado choca con otra cita. Puedes elegir la próxima hora disponible o reducir la duración para agendar en este horario.");
        setSuggestionTarget('edit');
        setShowWarningDialog(true);
      } else if (nextTime) {
        setRecommendedTime(nextTime);
        setRecommendedDuration(null);
        setWarningMessage("El horario seleccionado choca con otra cita. Te sugerimos la próxima hora disponible.");
        setSuggestionTarget('edit');
        setShowWarningDialog(true);
      } else if (maxDuration) {
        setRecommendedTime(null);
        setRecommendedDuration(maxDuration);
        setWarningMessage("La duración seleccionada choca con otra cita. Te sugerimos una duración menor para este horario.");
        setSuggestionTarget('edit');
        setShowWarningDialog(true);
      } else {
        setRecommendedTime(null);
        setRecommendedDuration(null);
        setWarningMessage("No hay espacio disponible para la duración y horario seleccionados. Intenta con otro horario o duración.");
        setSuggestionTarget('edit');
        setShowWarningDialog(true);
      }
      return false;
    }
    // Validar que la cita termine dentro del horario de atención y no cruce horario de comida (excepto urgencia)
    const endDuration = Number(appointmentData.duration || 30);
    const newAppStartDecimal = parseFloat((`${appointmentData.time!.split(":")[0]}.${appointmentData.time!.split(":")[1]}`));
    const newAppEndDecimal = newAppStartDecimal + endDuration / 60;
    if (newAppEndDecimal > CLINIC_END_TIME) {
      const maxDuration = Math.floor((CLINIC_END_TIME - newAppStartDecimal) * 60 / 15) * 15;
      const rawMaxDuration = Math.floor((CLINIC_END_TIME - newAppStartDecimal) * 60);
      const minDropdown = Math.min(...DURATION_OPTIONS);
      const suggestedDuration = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration).pop() || null;
      setRecommendedDuration(suggestedDuration && suggestedDuration >= minDropdown ? suggestedDuration : null);
      setWarningMessage("La duración seleccionada hace que la cita termine fuera del horario de atención. Te sugerimos una duración menor.");
      setSuggestionTarget('edit');
      setShowDurationWarning(true);
      return false;
    }
    // Validar que no cruce horario de comida (excepto urgencia)
    if (appointmentData.tipo !== "Urgencia") {
      const lunchStart = getLocalDate(appointmentData.date!, `${LUNCH_START}:00`);
      const lunchEnd = getLocalDate(appointmentData.date!, `${LUNCH_END}:00`);
      if (
        (newAppStart < lunchEnd && newAppEnd > lunchStart)
      ) {
        let maxEnd = Math.min(LUNCH_START, CLINIC_END_TIME);
        const appointmentEndDecimal = hourDecimal + endDuration / 60;
        if (hourDecimal < LUNCH_START && appointmentEndDecimal > LUNCH_START) {
          const minutesToLunch = (LUNCH_START * 60) - (hourDecimal * 60);
          const rawMaxDuration = Math.floor(minutesToLunch / 15) * 15;
          const minDropdown = Math.min(...DURATION_OPTIONS);
          const suggestedDuration = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration).pop() || null;
          setRecommendedDuration(suggestedDuration && suggestedDuration >= minDropdown ? suggestedDuration : null);
        } else if (hourDecimal >= LUNCH_END) {
          const minutesToEnd = (CLINIC_END_TIME * 60) - (hourDecimal * 60);
          const rawMaxDuration2 = Math.floor(minutesToEnd / 15) * 15;
          const minDropdown = Math.min(...DURATION_OPTIONS);
          const suggestedDuration2 = DURATION_OPTIONS.filter(opt => opt <= rawMaxDuration2).pop() || null;
          setRecommendedDuration(suggestedDuration2 && suggestedDuration2 >= minDropdown ? suggestedDuration2 : null);
        } else {
          setRecommendedDuration(null);
        }
        setWarningMessage("La duración seleccionada hace que la cita cruce el horario de comida. Te sugerimos una duración menor.");
        setShowDurationWarning(true);
        return false;
      }
    }
    // Si todo está bien
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
      toast({ title: "Éxito", description: "Cita actualizada correctamente", variant: "success" });
      triggerAnimation(appointmentData.id, 'animate__heartBeat');
      return true;
    } else {
      toast({ title: "Error", description: "No se pudo actualizar la cita", variant: "destructive" })
      return false;
    }
  }

  const handleCancelAppointment = async (id: number) => {
    if (!confirm("¿Está seguro de que desea cancelar esta cita?")) return;
    triggerAnimation(id, 'animate__fadeOutUp');
    setTimeout(async () => {
      const res = await fetch("/api/citas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchAppointments();
        setAppointmentAnimations((prev) => {
          const { [id]: _, ...rest } = prev;
          return rest;
        });
        toast({ title: "Éxito", description: "Cita cancelada correctamente", variant: "success" });
      } else {
        toast({ title: "Error", description: "No se pudo cancelar la cita", variant: "destructive" });
      }
    }, 900); // Espera a que termine la animación
  };

  const handleConfirmAppointment = async (id: number) => {
    const res = await fetch("/api/citas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado: "confirmada" }),
    })
    if (res.ok) {
      fetchAppointments()
      toast({ title: "Éxito", description: "Cita confirmada correctamente", variant: "success" });
      triggerAnimation(id, 'animate__heartBeat');
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

    // Horas de la cuadrícula (9:00 a 20:30 cada 15 min)
    const hours: string[] = []
    for (let h = 9; h < 20.5; h += 0.25) {
      const hour = Math.floor(h);
      const min = Math.round((h % 1) * 60).toString().padStart(2, "0");
      hours.push(`${hour.toString().padStart(2, "0")}:${min}`);
    }

    // Citas de la semana (comparar fechas como string, no parseISO)
    const weekAppointments = appointments.filter(app => app.estado !== "cancelada" && app.date && days.some(day => app.date === format(day, "yyyy-MM-dd")))

    // Handler para click en celda vacía
    const handleEmptyCellClick = (date: Date, hour: string) => {
      setNewAppointment(prev => ({
        ...prev,
        date: format(date, "yyyy-MM-dd"),
        time: hour,
      }));
      setShowNewAppointmentDialog(true);
    };

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
              <div key={`h-${hour}`} className="border-b border-r h-10 flex items-center justify-center text-xs bg-muted/50">
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
                // Si hay cita, renderizarla como antes
                if (cellAppointments.length > 0) {
                  return (
                    <div key={`cell-${rowIdx}-${colIdx}`} className={`border-b border-r h-10 relative ${isLunch ? "bg-gray-300" : ""}`}> 
                      {cellAppointments.map(app => {
                        const durationMin = Number(app.duracion || app.duration || 30)
                        const slots = Math.ceil(durationMin / 15)
                        const height = 40 * slots
                        return (
                          <div
                            key={app.id}
                            className={`absolute left-1 right-1 top-1 rounded px-2 py-1 text-xs cursor-pointer shadow 
                              ${app.estado === "confirmada" ? "bg-green-600" : "bg-primary/90"} text-white animate__animated ${appointmentAnimations[app.id] || ''}`}
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
                }
                // Si es horario de comida, no hacer clickeable
                if (isLunch) {
                  return (
                    <div key={`cell-${rowIdx}-${colIdx}`} className="border-b border-r h-10 bg-gray-300" />
                  )
                }
                // Espacio vacío clickeable
                return (
                  <div
                    key={`cell-${rowIdx}-${colIdx}`}
                    className="border-b border-r h-10 relative group cursor-pointer transition-colors duration-150"
                    style={{ backgroundColor: 'transparent' }}
                    onClick={() => handleEmptyCellClick(day, hour)}
                  >
                    <div
                      className="absolute inset-0 rounded transition-colors duration-150 group-hover:bg-blue-200 group-hover:dark:bg-blue-900"
                      style={{ zIndex: 1 }}
                    />
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
    // Horas de la cuadrícula (9:00 a 20:30 cada 15 min)
    const hours: string[] = []
    for (let h = 9; h < 20.5; h += 0.25) {
      const hour = Math.floor(h);
      const min = Math.round((h % 1) * 60).toString().padStart(2, "0");
      hours.push(`${hour.toString().padStart(2, "0")}:${min}`);
    }
    // Citas del día
    const dayAppointments = appointments.filter(app => app.estado !== "cancelada" && app.date === format(day, "yyyy-MM-dd"))

    // Handler para click en celda vacía (día)
    const handleEmptyCellClick = (date: Date, hour: string) => {
      setNewAppointment(prev => ({
        ...prev,
        date: format(date, "yyyy-MM-dd"),
        time: hour,
      }));
      setShowNewAppointmentDialog(true);
    };

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
            const [h, m] = hour.split(":").map(Number)
            const hourDecimal = h + m / 60
            const isLunch = hourDecimal >= LUNCH_START && hourDecimal < LUNCH_END
            const cellAppointments = dayAppointments.filter(app => app.time === hour)
            if (cellAppointments.length > 0) {
              return (
                <React.Fragment key={rowIdx}>
                  <div className="border-b border-r h-10 flex items-center justify-center text-xs bg-muted/50">{hour}</div>
                  <div className={`border-b h-10 relative`}>
                    {cellAppointments.map(app => {
                      const durationMin = Number(app.duracion || app.duration || 30)
                      const slots = Math.ceil(durationMin / 15)
                      const height = 40 * slots
                      return (
                        <div
                          key={app.id}
                          className={`absolute left-1 right-1 top-1 rounded px-2 py-1 text-xs cursor-pointer shadow ${app.estado === "confirmada" ? "bg-green-600" : "bg-primary/90"} text-white animate__animated ${appointmentAnimations[app.id] || ''}`}
                          style={{ zIndex: 2, height: `${height - 8}px` }}
                          onClick={() => handleAppointmentClick(app)}
                        >
                        </div>
                      )
                    })}
                  </div>
                </React.Fragment>
              )
            }
            if (isLunch) {
              return (
                <React.Fragment key={rowIdx}>
                  <div className="border-b border-r h-10 flex items-center justify-center text-xs bg-muted/50">{hour}</div>
                  <div className="border-b h-10 bg-gray-300" />
                </React.Fragment>
              )
            }
            // Espacio vacío clickeable
            return (
              <React.Fragment key={rowIdx}>
                <div className="border-b border-r h-10 flex items-center justify-center text-xs bg-muted/50">{hour}</div>
                <div
                  className="border-b h-10 relative group cursor-pointer transition-colors duration-150"
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => handleEmptyCellClick(day, hour)}
                >
                  <div
                    className="absolute inset-0 rounded transition-colors duration-150 group-hover:bg-blue-200 group-hover:dark:bg-blue-900"
                    style={{ zIndex: 1 }}
                  />
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
      if (!app.date || app.estado === "cancelada") return
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
                {dayAppointments.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className={`mb-1 px-1 py-0.5 rounded text-xs cursor-pointer truncate ${app.estado === "confirmada" ? "bg-green-600 text-white" : "bg-primary/90 text-white"} animate__animated ${appointmentAnimations[app.id] || ''}`}
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
        <div className="flex gap-2">
          <Button onClick={() => setShowNewAppointmentDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Cita
          </Button>
          <Button
            className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            onClick={() => router.push('/citasTabla')}
          >
            Ver todas las citas
          </Button>
        </div>
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
            <DialogTitle className="text-blue-700 dark:text-blue-400">Nueva Cita</DialogTitle>
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
                  <Input
                    id="patientSearch"
                    placeholder="Buscar paciente por nombre..."
                    value={patientSearchQuery || ""}
                    onChange={e => {
                      setPatientSearchQuery(e.target.value);
                      fetchPatients(e.target.value);
                      setShowPatientDropdown(true);
                    }}
                    className="w-full"
                  />
                  {showPatientDropdown && patients.length > 0 && (
                    <div className="absolute z-10 bg-white border rounded shadow max-h-40 overflow-y-auto w-full">
                      {patients.map((p: any) => (
                        <div
                          key={p.id}
                          className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setNewAppointment(prev => ({ ...prev, paciente_id: Number(p.id), patientName: p.name }));
                            setPatientSearchQuery(p.name);
                            setShowPatientDropdown(false);
                          }}
                        >
                          <div className="font-medium text-black">{p.name}</div>
                          <div className="text-xs text-gray-400">
                            {p.guardian ? <span>{p.guardian}</span> : <span>Sin tutor</span>}
                            {p.phone ? <span> &middot; {p.phone}</span> : null}
                          </div>
                        </div>
                      ))}
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
                    value={newAppointment.date || ""}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={e => {
                      setNewAppointment(prev => ({ ...prev, date: e.target.value }));
                      updateMinTime(e.target.value);
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
                    step={900}
                    onChange={e => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duración *
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newAppointment.duration?.toString() || "30"}
                    onValueChange={value => setNewAppointment(prev => ({ ...prev, duration: Number(value), duracion: value }))}
                  >
                    <SelectTrigger className="w-full">
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
                <Label htmlFor="tipo" className="text-right">
                  Tipo *
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newAppointment.tipo}
                    onValueChange={value => setNewAppointment(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger className="w-full">
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
                      <SelectItem value="Urgencia">Urgencias</SelectItem>
                      <SelectItem value="Toma de impresión">Toma de impresión</SelectItem>
                      <SelectItem value="Quirófano">Quirófano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notas" className="text-right">
                  Notas
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="notas"
                    className="w-full"
                    value={newAppointment.notas || ""}
                    onChange={e => setNewAppointment(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Notas adicionales sobre la cita"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewAppointmentDialog(false);
                resetNewAppointmentForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleAddAppointment(newAppointment)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de advertencia de duración */}
      <Dialog open={showDurationWarning} onOpenChange={setShowDurationWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <span className="text-xl">⚠️</span>
              Duración inválida
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-base">
            {warningMessage}
            {recommendedDuration && (
              <div className="mt-2">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (suggestionTarget === 'edit' && selectedAppointment) {
                      setSelectedAppointment(prev => prev ? { ...prev, duration: recommendedDuration } : prev);
                    } else if (suggestionTarget === 'new') {
                      setNewAppointment(prev => ({ ...prev, duration: recommendedDuration }));
                    }
                    setShowDurationWarning(false);
                  }}
                >
                  Usar duración sugerida: {recommendedDuration} min
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDurationWarning(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de advertencia de solapamiento de horario */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <span className="text-xl">⚠️</span>
              Horario no disponible
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-base">
            {warningMessage}
            {(recommendedTime || recommendedDuration) && (
              <div className="mt-2 flex flex-col gap-2">
                {recommendedTime && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      if (suggestionTarget === 'edit' && selectedAppointment) {
                        setSelectedAppointment(prev => prev ? { ...prev, time: recommendedTime } : prev);
                      } else if (suggestionTarget === 'new') {
                        setNewAppointment(prev => ({ ...prev, time: recommendedTime }));
                      }
                      setShowWarningDialog(false);
                    }}
                  >
                    Usar horario sugerido: {recommendedTime}
                  </Button>
                )}
                {recommendedDuration && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      if (suggestionTarget === 'edit' && selectedAppointment) {
                        setSelectedAppointment(prev => prev ? { ...prev, duration: recommendedDuration } : prev);
                      } else if (suggestionTarget === 'new') {
                        setNewAppointment(prev => ({ ...prev, duration: recommendedDuration }));
                      }
                      setShowWarningDialog(false);
                    }}
                  >
                    Usar duración sugerida: {recommendedDuration} min
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowWarningDialog(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de advertencia de domingo */}
      <Dialog open={showSundayWarning} onOpenChange={setShowSundayWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <span className="text-xl">⚠️</span>
              Domingo no permitido
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-base">No se pueden agendar citas los domingos.</div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowSundayWarning(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de advertencia de horario de comida */}
      <Dialog open={showLunchWarning} onOpenChange={setShowLunchWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <span className="text-xl">⚠️</span>
              Horario de comida
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 text-base">No se pueden agendar citas en horario de comida (1:00 PM a 4:30 PM), excepto si es una urgencia.</div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowLunchWarning(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle de cita */}
      <Modal open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="text-black font-bold">Detalle de la cita</ModalTitle>
          </ModalHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <div className="text-blue-500 font-bold mb-1">Información de la cita</div>
                <div><b>Fecha:</b> {selectedAppointment.date ? formatDateToSpanish(selectedAppointment.date) : "-"}</div>
                <div><b>Hora:</b> {selectedAppointment.time ? formatTimeTo12h(selectedAppointment.time) : "-"}</div>
                <div><b>Duración:</b> {selectedAppointment.duracion || selectedAppointment.duration || 30} min</div>
                <div><b>Tipo:</b> {selectedAppointment.tipo}</div>
                <div><b>Notas:</b> {selectedAppointment.notas || "Sin notas"}</div>
                <div>
                  <b>Estado:</b> {selectedAppointment.estado === "confirmada" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold text-xs ml-1">Confirmada</span>
                  ) : selectedAppointment.estado === "pendiente" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs ml-1">Pendiente</span>
                  ) : selectedAppointment.estado === "cancelada" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold text-xs ml-1">Cancelada</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-semibold text-xs ml-1">{selectedAppointment.estado}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-blue-500 font-bold mb-1">Información del paciente</div>
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
            <DialogTitle className="text-blue-700 dark:text-blue-400">Editar Cita</DialogTitle>
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
                      step={900} // 15 minutos
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
                      value={selectedAppointment?.tipo || ""}
                      onValueChange={value => setSelectedAppointment(selectedAppointment ? { ...selectedAppointment, tipo: value } : null)}
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
                        <SelectItem value="Urgencia">Urgencias</SelectItem>
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
                </div>              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAppointmentDialog(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (selectedAppointment) {
                const ok = await handleEditAppointment(selectedAppointment);
                if (ok) setShowEditAppointmentDialog(false);
              }
            }}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
