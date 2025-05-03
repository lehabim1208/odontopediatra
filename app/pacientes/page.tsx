"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Calendar, Filter, PlusCircle, X, FilePlus, ArrowUp, ArrowDown, History, Stethoscope, FolderArchive, TableCellsMerge, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { storage } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth-provider"
import { TreatmentTable } from "@/components/treatment-table"
import { FingerprintCapture } from "@/components/fingerprint-capture"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AppointmentDetails } from "@/components/appointment-details"
import { TreatmentDetails } from "@/components/treatment-details"
import { parseISO } from "date-fns"
import { usePatient } from "@/components/patient-context"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Patient {
  id: number
  name: string
  age: number
  guardian: string
  lastVisit: string
  nextVisit: string
  phone?: string
  additionalPhones?: string[]
  email?: string
  additionalInfo?: {
    weight?: string
    height?: string
    allergies?: string
    medications?: string
    bloodType?: string
    notes?: string
  }
  medicalInfo?: any // Información médica completa (cifrada)
}

interface SortConfig {
  key: keyof Patient | "lastVisit" | "nextVisit"
  direction: "asc" | "desc"
}

interface TreatmentRow {
  id: string
  toothNumber: string
  conventionalTreatment: string
  recommendedTreatment: string
  conventionalPrice: number
  recommendedPrice: number
}

interface Treatment {
  id: number
  patientId: number
  date: string
  rows: TreatmentRow[]
  conventionalTotal: number
  recommendedTotal: number
  status: "pending" | "approved"
  approvedType?: "conventional" | "recommended"
  fingerprintData?: string | null
  approvedDate?: string
}

const sortPatients = (patients: Patient[], sortConfig: SortConfig) => {
  return [...patients].sort((a, b) => {
    if (sortConfig.key === "name") {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      return sortConfig.direction === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    } else if (sortConfig.key === "age") {
      return sortConfig.direction === "asc" ? a.age - b.age : b.age - a.age
    } else if (sortConfig.key === "lastVisit") {
      const dateA = new Date(a.lastVisit)
      const dateB = new Date(b.lastVisit)
      return sortConfig.direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    } else if (sortConfig.key === "nextVisit") {
      // Manejar casos donde nextVisit es "Pendiente"
      if (a.nextVisit === "Pendiente" && b.nextVisit !== "Pendiente") return sortConfig.direction === "asc" ? 1 : -1
      if (a.nextVisit !== "Pendiente" && b.nextVisit === "Pendiente") return sortConfig.direction === "asc" ? -1 : 1
      if (a.nextVisit === "Pendiente" && b.nextVisit === "Pendiente") return 0

      const dateA = new Date(a.nextVisit)
      const dateB = new Date(b.nextVisit)
      return sortConfig.direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
    }
    return 0
  })
}

export default function PacientesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showAdditionalInfoDialog, setShowAdditionalInfoDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  // Reemplazar la definición del estado de filtros
  const [ageFilter, setAgeFilter] = useState<number | "">("")
  const [guardianFilter, setGuardianFilter] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    guardian: "",
    phone: "",
    additionalPhones: [] as string[],
    email: "",
  })
  const [additionalInfo, setAdditionalInfo] = useState({
    weight: "",
    height: "",
    allergies: "",
    medications: "",
    bloodType: "",
    notes: "",
  })
  const [editPatientInfo, setEditPatientInfo] = useState({
    name: "",
    age: "",
    sex: "",
    otherSex: "",
    birthdate: "",
    nationality: "",
    occupation: "",
    doctor: "",
    origin: "",
    residence: "",
    address: "",
    religion: "",
    email: "",
    phone: "",
    additionalPhones: [] as string[],
    guardian: "",
    birthWeight: "",
    birthHeight: "",
    birthType: "",
    otherBirthType: "",
    lastDentalExam: "",
    consultationReason: "",
    treatmentInterest: "",
    hereditaryDiseases: [] as string[],
    newHereditaryDisease: "",
    hereditaryNotes: "",
    personalHabits: [] as string[],
    newPersonalHabit: "",
    housingType: "",
    feeding: "",
    smoking: false,
    smokingDate: "",
    alcohol: false,
    alcoholDate: "",
    immunization: false,
    hobbies: "",
    sexualLife: "",
    healthConditions: [] as string[],
    orthodonticConsultation: false,
    orthodonticDate: "",
    orthodonticReason: "",
    biteProblems: "",
    dentalComments: "",
    systems: {} as { [key: string]: string },
    oralExploration: {} as { [key: string]: string },
    bloodPressure: "",
    respiratoryRate: "",
    pulse: "",
    temperature: "",
    regionalObservations: "",
    specialObservations: "",
  })

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageCache, setPageCache] = useState<{ [key: number]: Patient[] }>({})
  const [totalPatients, setTotalPatients] = useState(0)
  const pageSize = 10
  const isInitialRender = useRef(true)

  const totalFiltered = useMemo(() => {
    let filtered = patients
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.guardian.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (ageFilter !== "") {
      filtered = filtered.filter((patient) => patient.age === Number(ageFilter))
    }
    if (guardianFilter !== "") {
      filtered = filtered.filter((patient) => patient.guardian.toLowerCase().includes(guardianFilter.toLowerCase()))
    }
    return filtered.length
  }, [patients, searchQuery, ageFilter, guardianFilter])

  // Determinar el total de páginas y si hay más páginas según el modo
  const isSearchMode = searchQuery.trim() !== "" || ageFilter !== "" || guardianFilter !== ""
  const totalItems = isSearchMode ? totalFiltered : totalPatients
  const totalPages = Math.ceil(totalItems / pageSize)
  const canGoNext = page + 1 < totalPages
  const canGoPrev = page > 0

  // Memoizar el filtrado, orden y paginación para máximo rendimiento
  const filteredPatients = useMemo(() => {
    if (!isSearchMode) {
      // Paginación backend: mostrar directamente lo que devuelve la API
      return sortPatients(patients, sortConfig)
    }
    // Paginación local (búsqueda/filtros)
    let filtered = patients
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.guardian.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (ageFilter !== "") {
      filtered = filtered.filter((patient) => patient.age === Number(ageFilter))
    }
    if (guardianFilter !== "") {
      filtered = filtered.filter((patient) => patient.guardian.toLowerCase().includes(guardianFilter.toLowerCase()))
    }
    filtered = sortPatients(filtered, sortConfig)
    return filtered.slice(page * pageSize, (page + 1) * pageSize)
  }, [patients, searchQuery, ageFilter, guardianFilter, sortConfig, page, pageSize, isSearchMode])

  // Cargar pacientes paginados o búsqueda global
  useEffect(() => {
    setLoading(true)
    if (searchQuery.trim() !== "") {
      // Búsqueda global
      fetch(`/api/pacientes?search=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setPatients(data.patients)
          setTotalPatients(data.total)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      // Paginación normal
      fetch(`/api/pacientes?limit=${pageSize}&offset=${page * pageSize}`)
        .then((res) => res.json())
        .then((data) => {
          setPatients(data.patients)
          setTotalPatients(data.total)
          setPageCache((prev) => ({ ...prev, [page]: data.patients }))
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [page, searchQuery])

  // Pre-cargar la siguiente página en segundo plano después del primer render
  useEffect(() => {
    if (isInitialRender.current && totalPatients > pageSize) {
      isInitialRender.current = false
      const nextPage = page + 1
      if (!pageCache[nextPage]) {
        fetch(`/api/pacientes?limit=${pageSize}&offset=${nextPage * pageSize}`)
          .then((res) => res.json())
          .then((data) => {
            setPageCache((prev) => ({ ...prev, [nextPage]: data.patients }))
          })
      }
    }
  }, [totalPatients, page, pageCache])

  // Cambiar de página
  const handlePageChange = (newPage: number) => {
    if (pageCache[newPage]) {
      setPatients(pageCache[newPage])
      setPage(newPage)
    } else {
      setPage(newPage)
    }
  }

  // Agregar estos estados después de los estados existentes
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [currentTreatmentRows, setCurrentTreatmentRows] = useState<TreatmentRow[]>([])
  const [conventionalTotal, setConventionalTotal] = useState(0)
  const [recommendedTotal, setRecommendedTotal] = useState(0)
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<"conventional" | "recommended">("conventional")
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)
  // Agregar estos estados después de los estados existentes
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)
  const [selectedTreatmentForEdit, setSelectedTreatmentForEdit] = useState<any>(null)
  const [showTreatmentDetails, setShowTreatmentDetails] = useState(false)
  // Agregar este estado al componente PacientesPage, justo después de los otros estados
  const [showTermsDialog, setShowTermsDialog] = useState(false)

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return email === "" || emailRegex.test(email)
  }

  // Validate phone number (10 digits)
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/
    return phone === "" || phoneRegex.test(phone)
  }

  // Agregar esta función después de la función isValidPhone

  // Agregar esta función después de la función sortPatients
  const handleSort = (key: keyof Patient | "lastVisit" | "nextVisit") => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Handle new patient form submission
  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.guardian || !newPatient.phone) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
        duration: 2500,
      })
      return
    }
    if (!isValidPhone(newPatient.phone)) {
      toast({
        title: "Error",
        description: "El teléfono debe tener 10 dígitos",
        variant: "destructive",
        duration: 2500,
      })
      return
    }
    if (
      newPatient.additionalPhones.length > 0 &&
      newPatient.additionalPhones.some((phone) => phone.trim() === "" || !isValidPhone(phone))
    ) {
      toast({
        title: "Error",
        description: "El teléfono adicional debe tener 10 dígitos",
        variant: "destructive",
        duration: 2500,
      })
      return
    }
    if (newPatient.email && !isValidEmail(newPatient.email)) {
      toast({
        title: "Error",
        description: "El formato del correo electrónico no es válido",
        variant: "destructive",
        duration: 2500,
      })
      return
    }
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatient.name,
          guardian: newPatient.guardian,
          age: newPatient.age,
          phone: newPatient.phone,
          additionalPhone: newPatient.additionalPhones[0] || null,
          email: newPatient.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al registrar paciente")
      toast({
        title: "Éxito",
        description: "Paciente agregado correctamente",
        variant: "success",
        duration: 2500,
      })
      setShowNewPatientDialog(false)
      setNewPatient({ name: "", age: "", guardian: "", phone: "", additionalPhones: [], email: "" })
      // Refresca la lista de pacientes
      setLoading(true)
      fetch("/api/pacientes")
        .then((res) => res.json())
        .then((data) => {
          const pacientes = (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            age: p.edad,
            guardian: p.guardian,
            lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString("es-MX") : "",
            nextVisit: "Pendiente",
            phone: p.phone,
            additionalPhones: p.additionalPhone ? [p.additionalPhone] : [],
            email: p.email,
            medicalInfo: null,
          }))
          setPatients(pacientes)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar paciente",
        variant: "destructive",
        duration: 2500,
      })
    }
  }

  // Handle additional info submission
  const handleAddAdditionalInfo = () => {
    if (!selectedPatient) return

    // Crear un objeto con toda la información médica
    const medicalInfo = {
      // Información básica
      name: editPatientInfo.name || selectedPatient.name,
      age: editPatientInfo.age || selectedPatient.age,
      sex: editPatientInfo.sex || "",
      otherSex: editPatientInfo.otherSex || "",
      birthdate: editPatientInfo.birthdate || "",
      nationality: editPatientInfo.nationality || "",
      occupation: editPatientInfo.occupation || "",
      doctor: editPatientInfo.doctor || "",
      origin: editPatientInfo.origin || "",
      residence: editPatientInfo.residence || "",
      address: editPatientInfo.address || "",
      religion: editPatientInfo.religion || "",
      email: editPatientInfo.email || selectedPatient.email || "",
      phone: editPatientInfo.phone || selectedPatient.phone || "",
      additionalPhones:
        editPatientInfo.additionalPhones.length > 0
          ? editPatientInfo.additionalPhones
          : selectedPatient.additionalPhones || [],
      guardian: editPatientInfo.guardian || selectedPatient.guardian,
      birthWeight: editPatientInfo.birthWeight || "",
      birthHeight: editPatientInfo.birthHeight || "",
      birthType: editPatientInfo.birthType || "",
      otherBirthType: editPatientInfo.otherBirthType || "",
      lastDentalExam: editPatientInfo.lastDentalExam || "",
      consultationReason: editPatientInfo.consultationReason || "",
      treatmentInterest: editPatientInfo.treatmentInterest || "",

      // Antecedentes heredo-familiares
      hereditaryDiseases: editPatientInfo.hereditaryDiseases || [],
      newHereditaryDisease: editPatientInfo.newHereditaryDisease || "",
      hereditaryNotes: editPatientInfo.hereditaryNotes || "",
      personalHabits: editPatientInfo.personalHabits || [],
      newPersonalHabit: editPatientInfo.newPersonalHabit || "",
      housingType: editPatientInfo.housingType || "",
      feeding: editPatientInfo.feeding || "",
      smoking: typeof editPatientInfo.smoking === "boolean" ? editPatientInfo.smoking : false,
      smokingDate: editPatientInfo.smokingDate || "",
      alcohol: typeof editPatientInfo.alcohol === "boolean" ? editPatientInfo.alcohol : false,
      alcoholDate: editPatientInfo.alcoholDate || "",
      immunization: typeof editPatientInfo.immunization === "boolean" ? editPatientInfo.immunization : false,
      hobbies: editPatientInfo.hobbies || "",
      sexualLife: editPatientInfo.sexualLife || "",
      healthConditions: editPatientInfo.healthConditions || [],
      orthodonticConsultation: editPatientInfo.orthodonticConsultation || false,
      orthodonticDate: editPatientInfo.orthodonticDate || "",
      orthodonticReason: editPatientInfo.orthodonticReason || "",
      biteProblems: editPatientInfo.biteProblems || "",
      dentalComments: editPatientInfo.dentalComments || "",

      // Interrogatorio por aparatos y sistemas
      systems: editPatientInfo.systems || {},

      // Exploración física y regional
      bloodPressure: editPatientInfo.bloodPressure || "",
      respiratoryRate: editPatientInfo.respiratoryRate || "",
      pulse: editPatientInfo.pulse || "",
      temperature: editPatientInfo.temperature || "",
      regionalObservations: editPatientInfo.regionalObservations || "",
      oralExploration: editPatientInfo.oralExploration || {},
      specialObservations: editPatientInfo.specialObservations || "",

      // Información adicional (para mantener compatibilidad)
      additionalInfo: {
        weight: additionalInfo.weight || "",
        height: additionalInfo.height || "",
        allergies: additionalInfo.allergies || "",
        medications: additionalInfo.medications || "",
        bloodType: additionalInfo.bloodType || "",
        notes: additionalInfo.notes || "",
      },
    }

    // Actualizar el paciente con la información médica
    const updatedPatient = {
      ...selectedPatient,
      name: medicalInfo.name,
      age: medicalInfo.age,
      guardian: medicalInfo.guardian,
      phone: medicalInfo.phone,
      additionalPhones: medicalInfo.additionalPhones,
      email: medicalInfo.email,
      // Guardar toda la información médica
      medicalInfo: medicalInfo,
      // Mantener additionalInfo para compatibilidad
      additionalInfo: medicalInfo.additionalInfo,
    }

    // En handleAddAdditionalInfo, forzar el tipo Patient en el mapeo:
    const updatedPatients = patients.map((patient) => (patient.id === selectedPatient.id ? updatedPatient as Patient : patient))

    setPatients(updatedPatients)
    storage.setItem("patients", updatedPatients)
    setShowAdditionalInfoDialog(false)

    toast({
      title: "Éxito",
      description: "Historial médico actualizado correctamente",
      variant: "success",
      duration: 2500,
    })
  }

  // Agregar esta función después de handleAddInfo
  const handleCreateTreatment = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentTreatmentRows([
      {
        id: Date.now().toString(),
        toothNumber: "",
        conventionalTreatment: "",
        recommendedTreatment: "",
        conventionalPrice: 0,
        recommendedPrice: 0,
      },
    ])
    setShowTreatmentDialog(true)
  }

  // Agregar esta función después de handleCreateTreatment
  const handleTreatmentUpdateRows = (rows: TreatmentRow[]) => {
    setCurrentTreatmentRows(rows)
    const cTotal = rows.reduce((sum, row) => sum + (row.conventionalPrice || 0), 0)
    const rTotal = rows.reduce((sum, row) => sum + (row.recommendedPrice || 0), 0)
    setConventionalTotal(cTotal)
    setRecommendedTotal(rTotal)
  }

  // Modificar la función handleSaveTreatment para guardar la fecha y hora correctamente
  const handleSaveTreatment = (approved = false) => {
    if (!selectedPatient) return

    const treatments = storage.getItem("treatments") || []

    // Usar new Date().toISOString() para guardar la fecha y hora exactas
    const now = new Date()

    const newTreatment: Treatment = {
      id: treatments.length > 0 ? Math.max(...treatments.map((t: Treatment) => t.id)) + 1 : 1,
      patientId: selectedPatient.id,
      date: now.toISOString(), // Guardar como ISO string para evitar problemas de zona horaria
      rows: currentTreatmentRows,
      conventionalTotal,
      recommendedTotal,
      status: approved ? "approved" : "pending",
      ...(approved && {
        approvedType: selectedTreatmentType,
        fingerprintData,
        approvedDate: now.toISOString(),
      }),
    }

    const updatedTreatments = [...treatments, newTreatment]
    storage.setItem("treatments", updatedTreatments)

    if (approved) {
      setShowApprovalDialog(false)
    }
    setShowTreatmentDialog(false)

    toast({
      title: "Éxito",
      description: `Tratamiento ${approved ? "aprobado" : "guardado"} correctamente`,
      variant: "success",
      duration: 2500,
    })
  }

  // Modificar la función handleApprovalRequest para quitar las validaciones
  const handleApprovalRequest = () => {
    setFingerprintData(null)
    setShowApprovalDialog(true)
  }

  // Agregar esta función para manejar el clic en un tratamiento
  const handleTreatmentClick = (treatment: any) => {
    setSelectedTreatmentForEdit(treatment)
    setShowTreatmentDetails(true)
  }

  // Agregar esta función para manejar el clic en una cita
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowAppointmentDetails(true)
  }

  // Agregar esta función para actualizar la lista de tratamientos después de editar
  const handleTreatmentUpdate = () => {
    // Forzar el tipo Patient en el mapeo:
    const updatedPatients = patients.map((patient) => (patient.id === selectedPatient?.id ? selectedPatient as Patient : patient))

    setPatients(updatedPatients)
    storage.setItem("patients", updatedPatients)
    setSelectedTreatmentForEdit(null)
  }

  // Handle action buttons
  // Modificar la función handleViewHistory para incluir los tratamientos
  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowHistoryDialog(true)
  }

  const handleScheduleAppointment = (patientId: number) => {
    // Trigger loading animation
    const startEvent = new Event("next-route-change-start")
    document.dispatchEvent(startEvent)

    // Navigate after a short delay
    setTimeout(() => {
      router.push(`/citas?patient=${patientId}`)

      // Complete the loading animation after navigation
      setTimeout(() => {
        const completeEvent = new Event("next-route-change-complete")
        document.dispatchEvent(completeEvent)
      }, 300)
    }, 100)
  }

  // Y luego reemplazar la función handleViewOdontograma:
  const { navigateToOdontogram } = usePatient()

  const handleViewOdontograma = (patientId: number) => {
    // Trigger loading animation
    const startEvent = new Event("next-route-change-start")
    document.dispatchEvent(startEvent)

    // Usar el contexto para navegar
    navigateToOdontogram(patientId.toString())

    // Complete the loading animation after navigation
    setTimeout(() => {
      const completeEvent = new Event("next-route-change-complete")
      document.dispatchEvent(completeEvent)
    }, 300)
  }

  const handleViewRadiografias = (patientId: number) => {
    // Guardar el ID en sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedPatientId', String(patientId))
    }
    // Navegar a la página sin query string
    router.push('/radiografias')
  }

  const handleAddInfo = (patient: Patient) => {
    setSelectedPatient(patient)

    // Obtener información médica completa (si existe)
    const medicalInfo = patient.medicalInfo || {}

    // Initialize form with existing data
    setEditPatientInfo({
      name: patient.name,
      age: String(patient.age),
      sex: medicalInfo.sex || "",
      otherSex: medicalInfo.otherSex || "",
      birthdate: medicalInfo.birthdate || "",
      nationality: medicalInfo.nationality || "",
      occupation: medicalInfo.occupation || "",
      doctor: medicalInfo.doctor || "",
      origin: medicalInfo.origin || "",
      residence: medicalInfo.residence || "",
      address: medicalInfo.address || "",
      religion: medicalInfo.religion || "",
      email: patient.email || "",
      phone: patient.phone || "",
      additionalPhones: patient.additionalPhones || [],
      guardian: patient.guardian,
      birthWeight: medicalInfo.birthWeight || "",
      birthHeight: medicalInfo.birthHeight || "",
      birthType: medicalInfo.birthType || "",
      otherBirthType: medicalInfo.otherBirthType || "",
      lastDentalExam: medicalInfo.lastDentalExam || "",
      consultationReason: medicalInfo.consultationReason || "",
      treatmentInterest: medicalInfo.treatmentInterest || "",
      hereditaryDiseases: medicalInfo.hereditaryDiseases || [],
      newHereditaryDisease: medicalInfo.newHereditaryDisease || "",
      hereditaryNotes: medicalInfo.hereditaryNotes || "",
      personalHabits: medicalInfo.personalHabits || [],
      newPersonalHabit: medicalInfo.newPersonalHabit || "",
      housingType: medicalInfo.housingType || "",
      feeding: medicalInfo.feeding || "",
      smoking: typeof medicalInfo.smoking === "boolean" ? medicalInfo.smoking : false,
      smokingDate: medicalInfo.smokingDate || "",
      alcohol: typeof medicalInfo.alcohol === "boolean" ? medicalInfo.alcohol : false,
      alcoholDate: medicalInfo.alcoholDate || "",
      immunization: typeof medicalInfo.immunization === "boolean" ? medicalInfo.immunization : false,
      hobbies: medicalInfo.hobbies || "",
      sexualLife: medicalInfo.sexualLife || "",
      healthConditions: medicalInfo.healthConditions || [],
      orthodonticConsultation: false,
      orthodonticDate: medicalInfo.orthodonticDate || "",
      orthodonticReason: medicalInfo.orthodonticReason || "",
      biteProblems: medicalInfo.biteProblems || "",
      dentalComments: medicalInfo.dentalComments || "",
      systems: medicalInfo.systems || {},
      bloodPressure: medicalInfo.bloodPressure || "",
      respiratoryRate: medicalInfo.respiratoryRate || "",
      pulse: medicalInfo.pulse || "",
      temperature: medicalInfo.temperature || "",
      regionalObservations: medicalInfo.regionalObservations || "",
      oralExploration: medicalInfo.oralExploration || {},
      specialObservations: medicalInfo.specialObservations || "",
    })

    // Initialize additional info form with existing data if available
    if (patient.additionalInfo) {
      setAdditionalInfo({
        weight: patient.additionalInfo.weight || medicalInfo.weight || "",
        height: patient.additionalInfo.height || medicalInfo.height || "",
        allergies: patient.additionalInfo.allergies || "",
        medications: patient.additionalInfo.medications || "",
        bloodType: patient.additionalInfo.bloodType || "",
        notes: patient.additionalInfo.notes || "",
      })
    } else {
      setAdditionalInfo({
        weight: medicalInfo.weight || "",
        height: medicalInfo.height || "",
        allergies: "",
        medications: "",
        bloodType: "",
        notes: "",
      })
    }

    setShowAdditionalInfoDialog(true)
  }

  // Add additional phone field
  const addPhoneField = () => {
    if (newPatient.additionalPhones.length < 1) {
      setNewPatient({
        ...newPatient,
        additionalPhones: [...newPatient.additionalPhones, ""],
      })
    } else {
      toast({
        title: "Límite alcanzado",
        description: "Solo se permite un teléfono adicional",
        variant: "destructive",
        duration: 2500,
      })
    }
  }

  // Add additional phone field for edit
  const addEditPhoneField = () => {
    if (editPatientInfo.additionalPhones.length < 1) {
      setEditPatientInfo({
        ...editPatientInfo,
        additionalPhones: [...editPatientInfo.additionalPhones, ""],
      })
    } else {
      toast({
        title: "Límite alcanzado",
        description: "Solo se permite un teléfono adicional",
        variant: "destructive",
        duration: 2500,
      })
    }
  }

  // Remove additional phone field
  const removePhoneField = (index: number) => {
    const updatedPhones = [...newPatient.additionalPhones]
    updatedPhones.splice(index, 1)
    setNewPatient({
      ...newPatient,
      additionalPhones: updatedPhones,
    })
  }

  // Remove additional phone field for edit
  const removeEditPhoneField = (index: number) => {
    const updatedPhones = [...editPatientInfo.additionalPhones]
    updatedPhones.splice(index, 1)
    setEditPatientInfo({
      ...editPatientInfo,
      additionalPhones: updatedPhones,
    })
  }

  // Función para permitir solo números en los campos de teléfono
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, isAdditional = false, index = -1) => {
    // Permitir solo números
    const value = e.target.value.replace(/\D/g, "")

    if (isAdditional && index >= 0) {
      // Para teléfonos adicionales
      const updatedPhones = [...newPatient.additionalPhones]
      updatedPhones[index] = value
      setNewPatient({
        ...newPatient,
        additionalPhones: updatedPhones,
      })
    } else {
      // Para el teléfono principal
      setNewPatient({
        ...newPatient,
        phone: value,
      })
    }
  }

  // Función para permitir solo números en los campos de teléfono (edición)
  const handleEditPhoneInput = (e: React.ChangeEvent<HTMLInputElement>, isAdditional = false, index = -1) => {
    // Permitir solo números
    const value = e.target.value.replace(/\D/g, "")

    if (isAdditional && index >= 0) {
      // Para teléfonos adicionales
      const updatedPhones = [...editPatientInfo.additionalPhones]
      updatedPhones[index] = value
      setEditPatientInfo({
        ...editPatientInfo,
        additionalPhones: updatedPhones,
      })
    } else {
      // Para el teléfono principal
      setEditPatientInfo({
        ...editPatientInfo,
        phone: value,
      })
    }
  }

  // Modificar la función que maneja el botón de agregar enfermedades hereditarias
  const handleAddOtherHereditary = () => {
    if (editPatientInfo.newHereditaryDisease?.trim()) {
      const currentDiseases = editPatientInfo.hereditaryDiseases || []
      setEditPatientInfo({
        ...editPatientInfo,
        hereditaryDiseases: [...currentDiseases, editPatientInfo.newHereditaryDisease],
        newHereditaryDisease: "",
      })
    }
  }

  // Modificar la función que maneja el botón de agregar hábitos personales
  const handleAddOtherHabit = () => {
    if (editPatientInfo.newPersonalHabit?.trim()) {
      const currentHabits = editPatientInfo.personalHabits || []
      setEditPatientInfo({
        ...editPatientInfo,
        personalHabits: [...currentHabits, editPatientInfo.newPersonalHabit],
        newPersonalHabit: "",
      })
    }
  }

  // Agrega la función faltante para la huella digital
  const handleFingerprintCapture = (data: string | null) => {
    setFingerprintData(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary brand-name">Pacientes</h1>
          <p className="text-muted-foreground">Gestiona los registros de pacientes</p>
        </div>
        <Button onClick={() => setShowNewPatientDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="section-title">Buscar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o tutor..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilterDialog(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="section-title">Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Paginación superior */}
          <div className="flex justify-center mt-2 mb-4 gap-2">
            <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={!canGoPrev} size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 py-1 text-sm">Página {page + 1}</span>
            <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={!canGoNext} size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              {/* Reemplazar el encabezado de la tabla en el componente TableHeader */}
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    Nombre{" "}
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort("age")}>
                    Edad{" "}
                    {sortConfig.key === "age" &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Tutor</TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort("lastVisit")}>
                    Última Visita{" "}
                    {sortConfig.key === "lastVisit" &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort("nextVisit")}>
                    Próxima Cita{" "}
                    {sortConfig.key === "nextVisit" &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="inline h-4 w-4" />
                      ) : (
                        <ArrowDown className="inline h-4 w-4" />
                      ))}
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.name}
                        <div className="md:hidden text-sm text-muted-foreground">
                          {patient.age} años | Tutor: {patient.guardian}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{patient.age} años</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.guardian}</TableCell>
                      <TableCell className="hidden md:table-cell">{patient.lastVisit ? format(new Date(patient.lastVisit), "dd/MM/yyyy HH:mm") : ""}</TableCell>
                      <TableCell className="hidden md:table-cell">Pendiente</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            title="Historial"
                            onClick={() => handleViewHistory(patient)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          {hasPermission("citas") && (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Agendar Cita"
                            onClick={() => handleScheduleAppointment(patient.id)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            title="Realizar Tratamiento"
                            onClick={() => handleCreateTreatment(patient)}
                          >
                            <Stethoscope className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Editar historial médico completo"
                            onClick={() => handleAddInfo(patient)}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          {hasPermission("odontograma") && (
                            <Button
                              variant="outline"
                              size="icon"
                              title="Ver Odontograma Digital"
                              onClick={() => handleViewOdontograma(patient.id)}
                            >
                              <span className="sr-only">Ver Odontograma Digital</span>
                              <TableCellsMerge className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission("radiografias") && (
                            <Button
                              variant="outline"
                              size="icon"
                              title="Ver Documentos Médicos"
                              onClick={() => handleViewRadiografias(patient.id)}
                            >
                              <span className="sr-only">Ver Documentos Médicos</span>
                              <FolderArchive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No se encontraron pacientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {/* Paginación inferior */}
            <div className="flex justify-center mt-4 gap-2">
              <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={!canGoPrev} size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 py-1 text-sm">Página {page + 1}</span>
              <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={!canGoNext} size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Patient Dialog */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="section-title">Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Ingrese los datos del nuevo paciente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              {/* Modificar el campo de edad en el modal de nuevo paciente para usar un dropdown
              Reemplazar este bloque en el modal de nuevo paciente */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right">
                  Edad *
                </Label>
                <div className="col-span-3">
                  <select
                    id="age"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Seleccionar edad</option>
                    {Array.from({ length: 150 }, (_, i) => i + 1).map((age) => (
                      <option key={age} value={age.toString()}>
                        {age} años
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cambiar la etiqueta "Tutor" a "Nombre tutor" en el modal de nuevo paciente */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="guardian" className="text-right">
                  Nombre tutor *
                </Label>
                <Input
                  id="guardian"
                  value={newPatient.guardian}
                  onChange={(e) => setNewPatient({ ...newPatient, guardian: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono *
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={(e) => handlePhoneInput(e)}
                    className="flex-1"
                    placeholder="10 dígitos"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  {newPatient.additionalPhones.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addPhoneField}
                      title="Agregar teléfono adicional"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {newPatient.additionalPhones.map((phone, index) => (
                <div key={index} className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Teléfono adicional</Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => handlePhoneInput(e, true, index)}
                      className="flex-1"
                      placeholder="10 dígitos"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePhoneField(index)}
                      title="Eliminar teléfono"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="col-span-3"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPatientDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPatient}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient History Dialog */}
      {/* Modificar el DialogContent del historial médico: */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        {/* Modificar el DialogContent del historial médico: */}
        <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedPatient && `Historial de ${selectedPatient.name}`}
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <ScrollArea className="max-h-[calc(90vh-10rem)]">
              <div className="space-y-4 pr-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-primary">Información del paciente</h3>
                  <p>
                    <strong>Paciente:</strong> {selectedPatient.name}
                  </p>
                  <p>
                    <strong>Edad:</strong> {selectedPatient.age} años
                  </p>
                  <p>
                    <strong>Tutor:</strong> {selectedPatient.guardian}
                  </p>
                  <p>
                    <strong>Última visita:</strong> {selectedPatient.lastVisit}
                  </p>

                  {selectedPatient.phone && (
                    <p>
                      <strong>Teléfono:</strong> {selectedPatient.phone}
                    </p>
                  )}
                  {selectedPatient.additionalPhones && selectedPatient.additionalPhones.length > 0 && (
                    <p>
                      <strong>Teléfono adicional:</strong> {selectedPatient.additionalPhones.join(", ")}
                    </p>
                  )}
                  {selectedPatient.email && (
                    <p>
                      <strong>Email:</strong> {selectedPatient.email}
                    </p>
                  )}

                  {selectedPatient.additionalInfo && (
                    <div className="mt-2 pt-2 border-t border-accent-foreground/20">
                      {/* Quitar peso y talla de aquí, solo mostrar otros datos */}
                      {selectedPatient.additionalInfo.bloodType && (
                        <p>
                          <strong>Tipo de sangre:</strong> {selectedPatient.additionalInfo.bloodType}
                        </p>
                      )}
                      {selectedPatient.additionalInfo.allergies && (
                        <p>
                          <strong>Alergias:</strong> {selectedPatient.additionalInfo.allergies}
                        </p>
                      )}
                      {selectedPatient.additionalInfo.medications && (
                        <p>
                          <strong>Medicamentos:</strong> {selectedPatient.additionalInfo.medications}
                        </p>
                      )}
                      {selectedPatient.additionalInfo.notes && (
                        <p>
                          <strong>Notas:</strong> {selectedPatient.additionalInfo.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {selectedPatient.medicalInfo && (
                  <div className="mt-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-primary">Historial Médico Completo</h4>

                    {/* Ficha de Identificación */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 border-b pb-1">Ficha de Identificación</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {selectedPatient.medicalInfo.sex && (
                          <p>
                            <strong>Sexo:</strong>{" "}
                            {selectedPatient.medicalInfo.sex === "otro"
                              ? selectedPatient.medicalInfo.otherSex
                              : selectedPatient.medicalInfo.sex}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.birthdate && (
                          <p>
                            <strong>Fecha de nacimiento:</strong> {selectedPatient.medicalInfo.birthdate}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.nationality && (
                          <p>
                            <strong>Nacionalidad:</strong> {selectedPatient.medicalInfo.nationality}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.occupation && (
                          <p>
                            <strong>Ocupación:</strong> {selectedPatient.medicalInfo.occupation}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.doctor && (
                          <p>
                            <strong>Médico tratante:</strong> {selectedPatient.medicalInfo.doctor}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.origin && (
                          <p>
                            <strong>Lugar de origen:</strong> {selectedPatient.medicalInfo.origin}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.residence && (
                          <p>
                            <strong>Lugar de residencia:</strong> {selectedPatient.medicalInfo.residence}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.address && (
                          <p>
                            <strong>Domicilio:</strong> {selectedPatient.medicalInfo.address}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.religion && (
                          <p>
                            <strong>Religión:</strong> {selectedPatient.medicalInfo.religion}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.birthWeight && (
                          <p>
                            <strong>Peso al nacer:</strong> {selectedPatient.medicalInfo.birthWeight} kg
                          </p>
                        )}
                        {selectedPatient.medicalInfo.birthHeight && (
                          <p>
                            <strong>Talla al nacer:</strong> {selectedPatient.medicalInfo.birthHeight} cm
                          </p>
                        )}
                        {selectedPatient.medicalInfo.birthType && (
                          <p>
                            <strong>Tipo de parto:</strong>{" "}
                            {selectedPatient.medicalInfo.birthType === "otro"
                              ? selectedPatient.medicalInfo.otherBirthType
                              : selectedPatient.medicalInfo.birthType}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.lastDentalExam && (
                          <p>
                            <strong>Último examen dental:</strong> {selectedPatient.medicalInfo.lastDentalExam}
                          </p>
                        )}
                      </div>

                      {selectedPatient.medicalInfo.consultationReason && (
                        <div className="mt-2">
                          <p>
                            <strong>Motivo de consulta:</strong>
                          </p>
                          <p className="text-sm">{selectedPatient.medicalInfo.consultationReason}</p>
                        </div>
                      )}

                      {selectedPatient.medicalInfo.treatmentInterest && (
                        <div className="mt-2">
                          <p>
                            <strong>Interés del tratamiento:</strong>
                          </p>
                          <p className="text-sm">{selectedPatient.medicalInfo.treatmentInterest}</p>
                        </div>
                      )}
                    </div>

                    {/* Antecedentes heredo-familiares */}
                    {(selectedPatient.medicalInfo.hereditaryDiseases?.length > 0 ||
                      selectedPatient.medicalInfo.hereditaryNotes) && (
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h5 className="font-medium mb-2 border-b pb-1">Antecedentes Heredo-familiares</h5>

                        {selectedPatient.medicalInfo.hereditaryDiseases?.length > 0 && (
                          <div className="mb-2">
                            <p>
                              <strong>Enfermedades hereditarias:</strong>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedPatient.medicalInfo.hereditaryDiseases.map((disease: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  {disease}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPatient.medicalInfo.newHereditaryDisease && (
                          <div className="mt-2">
                            <p>
                              <strong>Otras enfermedades hereditarias:</strong>
                            </p>
                            <p className="text-sm">{selectedPatient.medicalInfo.newHereditaryDisease}</p>
                          </div>
                        )}

                        {selectedPatient.medicalInfo.hereditaryNotes && (
                          <div className="mt-2">
                            <p>
                              <strong>Notas adicionales:</strong>
                            </p>
                            <p className="text-sm">{selectedPatient.medicalInfo.hereditaryNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Antecedentes No Patológicos */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 border-b pb-1">Antecedentes No Patológicos</h5>

                      {selectedPatient.medicalInfo.personalHabits?.length > 0 && (
                        <div className="mb-2">
                          <p>
                            <strong>Hábitos personales:</strong>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedPatient.medicalInfo.personalHabits.map((habit: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                {habit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPatient.medicalInfo.newPersonalHabit && (
                        <div className="mt-2">
                          <p>
                            <strong>Otros hábitos personales:</strong>
                          </p>
                          <p className="text-sm">{selectedPatient.medicalInfo.newPersonalHabit}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                        {selectedPatient.medicalInfo.housingType && (
                          <p>
                            <strong>Tipo de habitación:</strong> {selectedPatient.medicalInfo.housingType}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.feeding && (
                          <p>
                            <strong>Alimentación:</strong> {selectedPatient.medicalInfo.feeding}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.smoking && (
                          <p>
                            <strong>Tabaquismo:</strong> Sí{" "}
                            {selectedPatient.medicalInfo.smokingDate &&
                              `(desde ${selectedPatient.medicalInfo.smokingDate})`}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.alcohol && (
                          <p>
                            <strong>Alcoholismo:</strong> Sí{" "}
                            {selectedPatient.medicalInfo.alcoholDate &&
                              `(desde ${selectedPatient.medicalInfo.alcoholDate})`}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.immunization && (
                          <p>
                            <strong>Cartilla de inmunización completa:</strong> Sí
                          </p>
                        )}
                        {selectedPatient.medicalInfo.sexualLife && (
                          <p>
                            <strong>Vida sexual:</strong> {selectedPatient.medicalInfo.sexualLife}
                          </p>
                        )}
                      </div>

                      {selectedPatient.medicalInfo.hobbies && (
                        <div className="mt-2">
                          <p>
                            <strong>Pasatiempos:</strong>
                          </p>
                          <p className="text-sm">{selectedPatient.medicalInfo.hobbies}</p>
                        </div>
                      )}
                    </div>

                    {/* Historial de Salud */}
                    {(selectedPatient.medicalInfo.healthConditions?.length > 0 ||
                      selectedPatient.medicalInfo.orthodonticConsultation ||
                      selectedPatient.medicalInfo.biteProblems ||
                      selectedPatient.medicalInfo.dentalComments) && (
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h5 className="font-medium mb-2 border-b pb-1">Historial de Salud</h5>

                        {selectedPatient.medicalInfo.healthConditions?.length > 0 && (
                          <div className="mb-2">
                            <p>
                              <strong>Condiciones de salud:</strong>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedPatient.medicalInfo.healthConditions.map((condition: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                  {condition}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPatient.medicalInfo.orthodonticConsultation && (
                          <div className="mt-2">
                            <p>
                              <strong>Consulta de ortodoncia previa:</strong> Sí
                            </p>
                            {selectedPatient.medicalInfo.orthodonticDate && (
                              <p className="text-sm">
                                <strong>Fecha:</strong> {selectedPatient.medicalInfo.orthodonticDate}
                              </p>
                            )}
                            {selectedPatient.medicalInfo.orthodonticReason && (
                              <p className="text-sm">
                                <strong>Motivo/Resultado:</strong> {selectedPatient.medicalInfo.orthodonticReason}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedPatient.medicalInfo.biteProblems && (
                          <div className="mt-2">
                            <p>
                              <strong>Problemas con la mordida:</strong>
                            </p>
                            <p className="text-sm">{selectedPatient.medicalInfo.biteProblems}</p>
                          </div>
                        )}

                        {selectedPatient.medicalInfo.dentalComments && (
                          <div className="mt-2">
                            <p>
                              <strong>Comentarios sobre problemas dentales:</strong>
                            </p>
                            <p className="text-sm">{selectedPatient.medicalInfo.dentalComments}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interrogatorio por aparatos y sistemas */}
                    {selectedPatient.medicalInfo.systems &&
                      Object.keys(selectedPatient.medicalInfo.systems).length > 0 && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 border-b pb-1">Interrogatorio por Aparatos y Sistemas</h5>

                          {Object.entries(selectedPatient.medicalInfo.systems).map(
                            ([system, value]: [string, any]) =>
                              value && (
                                <div key={system} className="mt-2">
                                  <p>
                                    <strong>{system}:</strong>
                                  </p>
                                  <p className="text-sm">{value}</p>
                                </div>
                              ),
                          )}
                        </div>
                      )}

                    {/* Exploración Física y Regional */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h5 className="font-medium mb-2 border-b pb-1">Exploración Física y Regional</h5>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        {selectedPatient.medicalInfo.bloodPressure && (
                          <p>
                            <strong>Presión arterial:</strong> {selectedPatient.medicalInfo.bloodPressure}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.respiratoryRate && (
                          <p>
                            <strong>Frecuencia respiratoria:</strong> {selectedPatient.medicalInfo.respiratoryRate}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.pulse && (
                          <p>
                            <strong>Pulso:</strong> {selectedPatient.medicalInfo.pulse}
                          </p>
                        )}
                        {selectedPatient.medicalInfo.temperature && (
                          <p>
                            <strong>Temperatura:</strong> {selectedPatient.medicalInfo.temperature}°C
                          </p>
                        )}
                        {selectedPatient.medicalInfo.weight ||
                          (selectedPatient.additionalInfo?.weight && (
                            <p>
                              <strong>Peso:</strong>{" "}
                              {selectedPatient.medicalInfo.weight || selectedPatient.additionalInfo?.weight} kg
                            </p>
                          ))}
                        {selectedPatient.medicalInfo.height ||
                          (selectedPatient.additionalInfo?.height && (
                            <p>
                              <strong>Talla:</strong>{" "}
                              {selectedPatient.medicalInfo.height || selectedPatient.additionalInfo?.height} cm
                            </p>
                          ))}
                      </div>

                      {selectedPatient.medicalInfo.regionalObservations && (
                        <div className="mt-2">
                          <p>
                            <strong>Observaciones generales:</strong>
                          </p>
                          <p className="text-sm">{selectedPatient.medicalInfo.regionalObservations}</p>
                        </div>
                      )}
                    </div>

                    {/* Exploración Oral */}
                    {selectedPatient.medicalInfo.oralExploration &&
                      Object.keys(selectedPatient.medicalInfo.oralExploration).length > 0 && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h5 className="font-medium mb-2 border-b pb-1">Exploración Oral</h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(selectedPatient.medicalInfo.oralExploration).map(
                              ([field, value]: [string, any]) =>
                                value && (
                                  <p key={field}>
                                    <strong>{field}:</strong> {value}
                                  </p>
                                ),
                            )}
                          </div>

                          {selectedPatient.medicalInfo.specialObservations && (
                            <div className="mt-2">
                              <p>
                                <strong>Observaciones especiales:</strong>
                              </p>
                              <p className="text-sm">{selectedPatient.medicalInfo.specialObservations}</p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
                <h4 className="font-semibold mt-4 section-title">Historial de Citas</h4>
                {(() => {
                  if (!selectedPatient) return <p>No hay citas registradas.</p>

                  const appointments = (storage.getItem("appointments") || [])
                    .filter((a: any) => a.patientId === selectedPatient.id.toString())
                    .sort((a: any, b: any) => {
                      const dateA = parseISO(`${a.date}T${a.time}`)
                      const dateB = parseISO(`${b.date}T${b.time}`)
                      return dateB.getTime() - dateA.getTime() // Orden descendente (más reciente primero)
                    })

                  if (appointments.length === 0) {
                    return <p>No hay citas registradas.</p>
                  }

                  return (
                    <div className="space-y-2">
                      {appointments.map((appointment: any) => {
                        const appointmentDate = parseISO(`${appointment.date}T${appointment.time}`)
                        const formattedDate = format(appointmentDate, "d 'de' MMMM, yyyy", { locale: es })
                        const formattedTime = format(appointmentDate, "HH:mm", { locale: es })

                        return (
                          <div
                            key={appointment.id}
                            className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  appointment.confirmed ? "bg-green-200 text-green-600" : "bg-blue-200 text-blue-600"
                                }`}
                              >
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">{appointment.type || "Consulta general"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formattedDate} - {formattedTime}
                                </p>
                              </div>
                            </div>
                            <div>
                              {appointment.confirmed ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  Confirmada
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                <h4 className="font-semibold mt-4 section-title">Historial de Tratamientos</h4>
                {(() => {
                  if (!selectedPatient) return <p>No hay tratamientos registrados.</p>

                  const treatments = (storage.getItem("treatments") || [])
                    .filter((t: any) => t.patientId === selectedPatient.id)
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

                  if (treatments.length === 0) {
                    return <p>No hay tratamientos registrados.</p>
                  }

                  return (
                    <div className="space-y-2">
                      {treatments.map((treatment: any) => {
                        // Usar la fecha guardada directamente
                        const treatmentDate = new Date(treatment.date)
                        const formattedDate = format(treatmentDate, "d 'de' MMMM, yyyy", { locale: es })
                        const formattedTime = format(treatmentDate, "HH:mm", { locale: es })

                        return (
                          <div
                            key={treatment.id}
                            className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleTreatmentClick(treatment)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  treatment.status === "approved"
                                    ? "bg-green-200 text-green-600"
                                    : "bg-amber-200 text-amber-600"
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium">Tratamiento</p>
                                <p className="text-xs text-muted-foreground">
                                  {formattedDate} - {formattedTime}
                                </p>
                              </div>
                            </div>
                            <div>
                              {treatment.status === "approved" ? (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  Aprobado
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowHistoryDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Info Dialog */}
      {/* Reemplazar el Dialog de información adicional con este código actualizado */}
      <Dialog open={showAdditionalInfoDialog} onOpenChange={setShowAdditionalInfoDialog}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedPatient && `Editar historial médico para ${selectedPatient.name}`}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(95vh-12rem)] px-6">
            <div className="space-y-8 py-4 pr-4">
              {/* 1. Ficha de Identificación */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Ficha de Identificación</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre</Label>
                    <Input
                      id="edit-name"
                      value={editPatientInfo.name}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-age">Edad</Label>
                    <select
                      id="edit-age"
                      value={editPatientInfo.age || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, age: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleccionar edad</option>
                      {Array.from({ length: 150 }, (_, i) => i + 1).map((age) => (
                        <option key={age} value={age.toString()}>
                          {age} años
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-sex">Sexo</Label>
                    <select
                      id="edit-sex"
                      value={editPatientInfo.sex || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditPatientInfo({
                          ...editPatientInfo,
                          sex: value,
                          otherSex: value === "otro" ? editPatientInfo.otherSex || "" : "",
                        })
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleccionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {editPatientInfo.sex === "otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-other-sex">Especificar</Label>
                      <Input
                        id="edit-other-sex"
                        value={editPatientInfo.otherSex || ""}
                        onChange={(e) => setEditPatientInfo({ ...editPatientInfo, otherSex: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-birthdate">Fecha de nacimiento</Label>
                    <Input
                      id="edit-birthdate"
                      type="date"
                      value={editPatientInfo.birthdate || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, birthdate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-nationality">Nacionalidad</Label>
                    <Input
                      id="edit-nationality"
                      value={editPatientInfo.nationality || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, nationality: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-occupation">Ocupación</Label>
                    <Input
                      id="edit-occupation"
                      value={editPatientInfo.occupation || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, occupation: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-doctor">Médico tratante</Label>
                    <Input
                      id="edit-doctor"
                      value={editPatientInfo.doctor || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, doctor: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-origin">Lugar de origen</Label>
                    <Input
                      id="edit-origin"
                      value={editPatientInfo.origin || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, origin: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-residence">Lugar de residencia</Label>
                    <Input
                      id="edit-residence"
                      value={editPatientInfo.residence || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, residence: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Domicilio</Label>
                    <Input
                      id="edit-address"
                      value={editPatientInfo.address || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-religion">Religión</Label>
                    <Input
                      id="edit-religion"
                      value={editPatientInfo.religion || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, religion: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Correo electrónico</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editPatientInfo.email || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, email: e.target.value })}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="flex items-center">
                      Teléfono <AlertCircle className="h-4 w-4 ml-1 text-amber-500" />
                    </Label>
                    <Input
                      id="edit-phone"
                      value={editPatientInfo.phone || ""}
                      onChange={(e) => handleEditPhoneInput(e)}
                      placeholder="10 dígitos"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-guardian">Padre o Tutor</Label>
                    <Input
                      id="edit-guardian"
                      value={editPatientInfo.guardian || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, guardian: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-birth-weight">Peso al nacer (kg)</Label>
                    <Input
                      id="edit-birth-weight"
                      type="number"
                      step="0.01"
                      value={editPatientInfo.birthWeight || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, birthWeight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-birth-height">Talla al nacer (cm)</Label>
                    <Input
                      id="edit-birth-height"
                      type="number"
                      step="0.1"
                      value={editPatientInfo.birthHeight || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, birthHeight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-birth-type">Tipo de parto</Label>
                    <select
                      id="edit-birth-type"
                      value={editPatientInfo.birthType || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setEditPatientInfo({
                          ...editPatientInfo,
                          birthType: value,
                          otherBirthType: value === "otro" ? editPatientInfo.otherBirthType ||"" : "",
                        })
                      }}
                      className="flex h-10 w-full rounded-md border border-input bgbackground px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleccionar</option>
                      <option value="natural">Natural</option>
                      <option value="cesarea">Cesárea</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {editPatientInfo.birthType === "otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-other-birth-type">Especificar</Label>
                      <Input
                        id="edit-other-birth-type"
                        value={editPatientInfo.otherBirthType || ""}
                        onChange={(e) => setEditPatientInfo({ ...editPatientInfo, otherBirthType: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-last-dental-exam">Fecha del último examen dental</Label>
                    <Input
                      id="edit-last-dental-exam"
                      type="date"
                      value={editPatientInfo.lastDentalExam || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, lastDentalExam: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-consultation-reason">Motivo de la consulta</Label>
                    <Textarea
                      id="edit-consultation-reason"
                      value={editPatientInfo.consultationReason || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, consultationReason: e.target.value })}
                      placeholder="Describa el motivo de la consulta"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-treatment-interest">Interés del tratamiento</Label>
                    <Textarea
                      id="edit-treatment-interest"
                      value={editPatientInfo.treatmentInterest || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, treatmentInterest: e.target.value })}
                      placeholder="Describa el interés en el tratamiento"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Antecedentes Heredo-familiares */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Antecedentes Heredo-familiares</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      "Diabetes Mellitus",
                      "Hipertensión",
                      "Carcinomas",
                      "Cardiopatías",
                      "Hepatitis",
                      "Nefropatías",
                      "Enf. endocrinas",
                      "Enf. Mentales",
                      "Epilepsia",
                      "Asma",
                      "Enf. Hematológicas",
                      "Sífilis",
                      "No sabe",
                    ].map((disease) => (
                      <div key={disease} className="flex items-center space-x-2">
                        <Checkbox
                          id={`hereditary-${disease.toLowerCase().replace(/\s+/g, "-")}`}
                          checked={editPatientInfo.hereditaryDiseases?.includes(disease) || false}
                          onCheckedChange={(checked) => {
                            const currentDiseases = editPatientInfo.hereditaryDiseases || []
                            setEditPatientInfo({
                              ...editPatientInfo,
                              hereditaryDiseases: checked
                                ? [...currentDiseases, disease]
                                : currentDiseases.filter((d) => d !== disease),
                            })
                          }}
                        />
                        <Label
                          htmlFor={`hereditary-${disease.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {disease}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-other-hereditary">Otras enfermedades hereditarias</Label>
                    <Textarea
                      id="edit-other-hereditary"
                      value={editPatientInfo.newHereditaryDisease || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, newHereditaryDisease: e.target.value })}
                      placeholder="Escriba otras enfermedades hereditarias"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-hereditary-notes">Notas adicionales</Label>
                    <Textarea
                      id="edit-hereditary-notes"
                      value={editPatientInfo.hereditaryNotes || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, hereditaryNotes: e.target.value })}
                      placeholder="Notas adicionales sobre antecedentes heredo-familiares"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Antecedentes No Patológicos */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Antecedentes No Patológicos</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      "Cepillo desgastado",
                      "Uso de hilo dental",
                      "Uso de enjuague bucal",
                      "Cepillado 3 veces al día",
                      "Cepillado irregular",
                    ].map((habit) => (
                      <div key={habit} className="flex items-center space-x-2">
                        <Checkbox
                          id={`habit-${habit.toLowerCase().replace(/\s+/g, "-")}`}
                          checked={editPatientInfo.personalHabits?.includes(habit) || false}
                          onCheckedChange={(checked) => {
                            const currentHabits = editPatientInfo.personalHabits || []
                            setEditPatientInfo({
                              ...editPatientInfo,
                              personalHabits: checked
                                ? [...currentHabits, habit]
                                : currentHabits.filter((h) => h !== habit),
                            })
                          }}
                        />
                        <Label
                          htmlFor={`habit-${habit.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {habit}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-other-habit">Otros hábitos personales</Label>
                    <Textarea
                      id="edit-other-habit"
                      value={editPatientInfo.newPersonalHabit || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, newPersonalHabit: e.target.value })}
                      placeholder="Escriba otros hábitos personales"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-housing-type">Tipo de habitación</Label>
                      <Input
                        id="edit-housing-type"
                        value={editPatientInfo.housingType || ""}
                        onChange={(e) => setEditPatientInfo({ ...editPatientInfo, housingType: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-feeding">Alimentación</Label>
                      <Input
                        id="edit-feeding"
                        value={editPatientInfo.feeding || ""}
                        onChange={(e) => setEditPatientInfo({ ...editPatientInfo, feeding: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-smoking"
                          checked={editPatientInfo.smoking || false}
                          onCheckedChange={(checked) => {
                            setEditPatientInfo({
                              ...editPatientInfo,
                              smoking: !!checked,
                            })
                          }}
                        />
                        <Label htmlFor="edit-smoking">Tabaquismo</Label>
                      </div>
                      {editPatientInfo.smoking && (
                        <Input
                          type="date"
                          value={editPatientInfo.smokingDate || ""}
                          onChange={(e) => setEditPatientInfo({ ...editPatientInfo, smokingDate: e.target.value })}
                          placeholder="Fecha de inicio"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit-alcohol"
                          checked={editPatientInfo.alcohol || false}
                          onCheckedChange={(checked) => {
                            setEditPatientInfo({
                              ...editPatientInfo,
                              alcohol: !!checked,
                            })
                          }}
                        />
                        <Label htmlFor="edit-alcohol">Alcoholismo</Label>
                      </div>
                      {editPatientInfo.alcohol && (
                        <Input
                          type="date"
                          value={editPatientInfo.alcoholDate || ""}
                          onChange={(e) => setEditPatientInfo({ ...editPatientInfo, alcoholDate: e.target.value })}
                          placeholder="Fecha de inicio"
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-immunization"
                        checked={editPatientInfo.immunization || false}
                        onCheckedChange={(checked) => {
                          setEditPatientInfo({
                            ...editPatientInfo,
                            immunization: !!checked,
                          })
                        }}
                      />
                      <Label htmlFor="edit-immunization">Cartilla de inmunización completa</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-hobbies">Pasatiempos</Label>
                    <Textarea
                      id="edit-hobbies"
                      value={editPatientInfo.hobbies || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, hobbies: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-sexual-life">Vida sexual</Label>
                    <select
                      id="edit-sexual-life"
                      value={editPatientInfo.sexualLife || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, sexualLife: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Seleccionar</option>
                      <option value="activa">Activa</option>
                      <option value="no-activa">No activa</option>
                      <option value="prefiere-no-decir">Prefiere no decir</option>
                      <option value="no-aplica">No aplica (es menor)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Historial de Salud */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Historial de Salud</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      "Accidentes en la cara",
                      "Operaciones en la cara",
                      "Alergias",
                      "Problemas de oído",
                      "Problemas de nacimiento",
                      "Problemas de sangrado",
                      "Problemas de lenguaje",
                      "Problemas de respiración",
                      "Asma",
                      "Anemia",
                      "Problemas de amígdalas",
                      "Diabetes",
                      "Epilepsia",
                      "Fiebre reumática",
                      "Enfermedades del corazón",
                      "Operación de amígdalas o adenoides",
                      "Dificultad para masticar o deglutir",
                      "Ronca al dormir",
                      "Respira por la boca",
                      "Chupa el dedo",
                      "Se muerde el labio",
                      "Se muerde las uñas",
                      "Rechina los dientes",
                      "Enfermedades de transmisión sexual",
                    ].map((condition) => (
                      <div key={condition} className="flex items-center space-x-2">
                        <Checkbox
                          id={`health-${condition.toLowerCase().replace(/\s+/g, "-")}`}
                          checked={editPatientInfo.healthConditions?.includes(condition) || false}
                          onCheckedChange={(checked) => {
                            const currentConditions = editPatientInfo.healthConditions || []
                            setEditPatientInfo({
                              ...editPatientInfo,
                              healthConditions: checked
                                ? [...currentConditions, condition]
                                : currentConditions.filter((c) => c !== condition),
                            })
                          }}
                        />
                        <Label
                          htmlFor={`health-${condition.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {condition}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-orthodontic-consultation"
                        checked={editPatientInfo.orthodonticConsultation || false}
                        onCheckedChange={(checked) => {
                          setEditPatientInfo({
                            ...editPatientInfo,
                            orthodonticConsultation: !!checked,
                          })
                        }}
                      />
                      <Label htmlFor="edit-orthodontic-consultation">
                        ¿Ha tenido alguna vez una consulta de ortodoncia?
                      </Label>
                    </div>

                    {editPatientInfo.orthodonticConsultation && (
                      <div className="space-y-2 pl-6 mt-2">
                        <Label htmlFor="edit-orthodontic-date">¿Cuándo?</Label>
                        <Input
                          id="edit-orthodontic-date"
                          type="date"
                          value={editPatientInfo.orthodonticDate || ""}
                          onChange={(e) => setEditPatientInfo({ ...editPatientInfo, orthodonticDate: e.target.value })}
                        />

                        <Label htmlFor="edit-orthodontic-reason">¿Por qué? ¿Cuál fue el resultado?</Label>
                        <Textarea
                          id="edit-orthodontic-reason"
                          value={editPatientInfo.orthodonticReason || ""}
                          onChange={(e) =>
                            setEditPatientInfo({ ...editPatientInfo, orthodonticReason: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-bite-problems">Problemas con la mordida o posición de los dientes</Label>
                    <Textarea
                      id="edit-bite-problems"
                      value={editPatientInfo.biteProblems || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, biteProblems: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dental-comments">Comentarios de terceros sobre problemas dentales</Label>
                    <Textarea
                      id="edit-dental-comments"
                      value={editPatientInfo.dentalComments || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, dentalComments: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Interrogatorio por Aparatos y Sistemas */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">
                  Interrogatorio por Aparatos y Sistemas
                </h3>

                <div className="space-y-4">
                  {[
                    "Aparato digestivo",
                    "Aparato cardiovascular",
                    "Aparato respiratorio",
                    "Aparato genito-urinario",
                    "Sistema endocrino",
                    "Sistema nervioso",
                  ].map((system) => (
                    <div key={system} className="space-y-2">
                      <Label htmlFor={`edit-system-${system.toLowerCase().replace(/\s+/g, "-")}`}>{system}</Label>
                      <Textarea
                        id={`edit-system-${system.toLowerCase().replace(/\s+/g, "-")}`}
                        value={editPatientInfo.systems?.[system] || ""}
                        onChange={(e) => {
                          const currentSystems = editPatientInfo.systems || {}
                          setEditPatientInfo({
                            ...editPatientInfo,
                            systems: {
                              ...currentSystems,
                              [system]: e.target.value,
                            },
                          })
                        }}
                        placeholder={`Información sobre ${system.toLowerCase()}`}
                        className="min-h-[80px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Exploración Física y Regional */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Exploración Física y Regional</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-blood-pressure">Presión arterial</Label>
                    <Input
                      id="edit-blood-pressure"
                      value={editPatientInfo.bloodPressure || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, bloodPressure: e.target.value })}
                      placeholder="Ej: 120/80 mmHg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-respiratory-rate">Frecuencia respiratoria</Label>
                    <Input
                      id="edit-respiratory-rate"
                      type="number"
                      value={editPatientInfo.respiratoryRate || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, respiratoryRate: e.target.value })}
                      placeholder="Respiraciones por minuto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-pulse">Pulso</Label>
                    <Input
                      id="edit-pulse"
                      type="number"
                      value={editPatientInfo.pulse || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, pulse: e.target.value })}
                      placeholder="Latidos por minuto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-temperature">Temperatura</Label>
                    <Input
                      id="edit-temperature"
                      type="number"
                      step="0.1"
                      value={editPatientInfo.temperature || ""}
                      onChange={(e) => setEditPatientInfo({ ...editPatientInfo, temperature: e.target.value })}
                      placeholder="°C"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-weight">Peso (kg)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      step="0.1"
                      value={additionalInfo.weight || ""}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, weight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-height">Talla (cm)</Label>
                    <Input
                      id="edit-height"
                      type="number"
                      step="0.1"
                      value={additionalInfo.height || ""}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, height: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-regional-observations">Observaciones generales de la exploración regional</Label>
                  <Textarea
                    id="edit-regional-observations"
                    value={editPatientInfo.regionalObservations || ""}
                    onChange={(e) => setEditPatientInfo({ ...editPatientInfo, regionalObservations: e.target.value })}
                    placeholder="Observaciones sobre cabeza, cuello, etc."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* 7. Exploración Oral */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary border-b pb-2">Exploración Oral</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Higiene",
                    "Periodonto",
                    "Prevalencia de caries",
                    "Dentición",
                    "Dientes faltantes",
                    "Dientes retenidos",
                    "Dientes impactados",
                    "Descalcificación de dientes",
                    "Inserción de frenillos",
                    "Labios",
                    "Proporción lengua-arcos",
                    "Problemas de lenguaje",
                    "Terceros molares",
                    "Hábitos",
                    "Tipo de perfil",
                    "Tipo de cráneo",
                    "Tipo de cara",
                    "Forma de las arcadas dentarias",
                    "Forma del paladar",
                  ].map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`edit-oral-${field.toLowerCase().replace(/\s+/g, "-")}`}>{field}</Label>
                      <Input
                        id={`edit-oral-${field.toLowerCase().replace(/\s+/g, "-")}`}
                        value={editPatientInfo.oralExploration?.[field] || ""}
                        onChange={(e) => {
                          const currentOralExploration = editPatientInfo.oralExploration || {}
                          setEditPatientInfo({
                            ...editPatientInfo,
                            oralExploration: {
                              ...currentOralExploration,
                              [field]: e.target.value,
                            },
                          })
                        }}
                        className="focus:ring-0 focus:ring-offset-0"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-special-observations">Observaciones especiales</Label>
                  <Textarea
                    id="edit-special-observations"
                    value={editPatientInfo.specialObservations || ""}
                    onChange={(e) => setEditPatientInfo({ ...editPatientInfo, specialObservations: e.target.value })}
                    className="min-h-[100px] focus:ring-0 focus:ring-offset-0"
                  />
                </div>

                {/* Agregar términos y condiciones aquí, justo después de Observaciones especiales */}
                <div className="mt-6 text-center">
                  <Button variant="link" className="text-primary underline" onClick={() => setShowTermsDialog(true)}>
                    Leer términos y condiciones
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowAdditionalInfoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdditionalInfo}>Guardar Historial Médico</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="section-title">Términos y Condiciones</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Certifico que toda la información proporcionada es correcta y que es mi responsabilidad informar sobre
              cualquier cambio sobre mi salud. He sido informado acerca del diagnóstico y plan de tratamiento que
              recibiré en la clínica de rehabilitación oral. Campus Xalapa, y reconozco las complicaciones que se puedan
              presentar dichos procedimientos, por lo que no tengo dudas al respecto y autorizo al odontólogo tratante y
              de esta forma para que efectúe los tratamientos que sean necesarios para el alivio y/o curar de los
              padecimientos desde ahora y hasta el final de mi tratamiento.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTermsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="section-title">Filtros de Búsqueda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ageFilter">Edad</Label>
              <Input
                id="ageFilter"
                type="number"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value ? Number(e.target.value) : "")}
                placeholder="Filtrar por edad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianFilter">Tutor</Label>
              <Input
                id="guardianFilter"
                value={guardianFilter}
                onChange={(e) => setGuardianFilter(e.target.value)}
                placeholder="Filtrar por tutor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAgeFilter("")
                setGuardianFilter("")
              }}
            >
              Limpiar
            </Button>
            <Button onClick={() => setShowFilterDialog(false)}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Dialog */}
      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Realizar Tratamiento</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Crear plan de tratamiento para ${selectedPatient.name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="space-y-6 p-1">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Información del Paciente</h3>
                {selectedPatient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>Paciente:</strong> {selectedPatient.name}
                      </p>
                      <p>
                        <strong>Edad:</strong> {selectedPatient.age} años
                      </p>
                      <p>
                        <strong>Tutor:</strong> {selectedPatient.guardian}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Fecha:</strong> {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Plan de Tratamiento</h3>
                <TreatmentTable onUpdate={handleTreatmentUpdateRows} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowTreatmentDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={() => handleSaveTreatment(false)} className="w-full sm:w-auto">
              Guardar Tratamiento
            </Button>
            <Button onClick={handleApprovalRequest} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Aprobar Tratamiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[450px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="section-title">Aprobar Tratamiento</DialogTitle>
            <DialogDescription>
              Seleccione el tipo de tratamiento a aprobar y capture la huella digital del tutor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Seleccione el tratamiento a aprobar</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={selectedTreatmentType === "conventional" ? "default" : "outline"}
                  onClick={() => setSelectedTreatmentType("conventional")}
                  className="w-full h-9 text-sm"
                >
                  Convencional (${conventionalTotal.toLocaleString()})
                </Button>
                <Button
                  variant={selectedTreatmentType === "recommended" ? "default" : "outline"}
                  onClick={() => setSelectedTreatmentType("recommended")}
                  className="w-full h-9 text-sm"
                >
                  Recomendado (${recommendedTotal.toLocaleString()})
                </Button>
              </div>
            </div>

            <FingerprintCapture onCapture={handleFingerprintCapture} />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={() => handleSaveTreatment(true)} disabled={!fingerprintData} className="w-full sm:w-auto">
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agregar estos componentes al final del componente principal, justo antes del cierre final */}
      <AppointmentDetails
        appointment={selectedAppointment}
        open={showAppointmentDetails}
        onOpenChange={setShowAppointmentDetails}
      />

      <TreatmentDetails
        treatment={selectedTreatmentForEdit}
        patient={selectedPatient}
        open={showTreatmentDetails}
        onOpenChange={setShowTreatmentDetails}
        onUpdate={handleTreatmentUpdate}
      />
    </div>
  )
}