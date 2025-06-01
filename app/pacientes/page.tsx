"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileText, Calendar, Filter, PlusCircle, X, FilePlus, ArrowUp, ArrowDown, History, Stethoscope, FolderArchive, TableCellsMerge, ChevronLeft, ChevronRight, Fingerprint } from "lucide-react"
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
import TutorModal from "@/components/tutor/TutorModal"
import PatientTreatmentsSection from "@/components/PatientTreatmentsSection"
import EditMedicalHistoryDialog from "@/components/EditMedicalHistoryDialog"
import PatientTreatmentsEdit from "@/components/PatientTreatmentsEdit";
import PatientTreatmentsApprovedModal from "@/components/PatientTreatmentsApprovedModal";
import { LoadingSpinner } from "@/components/loading-spinner";
import { AdditionalInfoDialog } from "@/components/AdditionalInfoDialog";

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
  const [showTutorModal, setShowTutorModal] = useState(false)
  const [selectedTutorPatient, setSelectedTutorPatient] = useState<Patient | null>(null)
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
  const [isSavingTreatment, setIsSavingTreatment] = useState(false)

  // Estado para el ID del tratamiento en aprobación
  const [approvalTreatmentId, setApprovalTreatmentId] = useState<number | null>(null)

  // Estados para citas y tratamientos del historial
  const [historyAppointments, setHistoryAppointments] = useState<any[]>([])
  const [historyTreatments, setHistoryTreatments] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // 1. Agrega un estado global para loading de tratamiento
  const [treatmentLoading, setTreatmentLoading] = useState(false);

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

  // Nuevo estado y lógica para mostrar el modal aprobado
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvedModalData, setApprovedModalData] = useState<any>(null);
  const [approvedModalTutor, setApprovedModalTutor] = useState<any>(null);

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
      systems: editPatientInfo.systems || {},
      oralExploration: editPatientInfo.oralExploration || {},
      bloodPressure: editPatientInfo.bloodPressure || "",
      respiratoryRate: editPatientInfo.respiratoryRate || "",
      pulse: editPatientInfo.pulse || "",
      temperature: editPatientInfo.temperature || "",
      regionalObservations: editPatientInfo.regionalObservations || "",
      specialObservations: editPatientInfo.specialObservations || "",
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

  // Modificar la función handleSaveTreatment para guardar en la base de datos
  const handleSaveTreatment = async (approved = false) => {
    if (!selectedPatient || isSavingTreatment) return;
    setIsSavingTreatment(true);
    // Prepara los detalles en el formato esperado por la API
    const detalles = currentTreatmentRows.map(row => ({
      organo_dentario: row.toothNumber,
      tratamiento_convencional: row.conventionalTreatment,
      tratamiento_recomendado: row.recommendedTreatment,
      precio_convencional: row.conventionalPrice,
      precio_recomendado: row.recommendedPrice,
    }));

    const body = {
      id_paciente: selectedPatient.id,
      total_convencional: conventionalTotal,
      total_recomendado: recommendedTotal,
      detalles,
    };

    try {
      const res = await fetch("/api/tratamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast({
          title: "Éxito",
          description: "Tratamiento guardado correctamente",
          variant: "success",
          duration: 2500,
        });
        setShowTreatmentDialog(false);
        // Aquí puedes refrescar la lista de tratamientos si lo deseas
      } else {
        throw new Error(data.error || "Error al guardar tratamiento");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 2500,
      });
    } finally {
      setIsSavingTreatment(false);
    }
  };

  // Modificar la función handleApprovalRequest para quitar las validaciones
  const handleApprovalRequest = async () => {
    if (!selectedPatient || isSavingTreatment) return;
    setIsSavingTreatment(true);
    setFingerprintData(null);
    // Guardar tratamiento como pendiente
    const detalles = currentTreatmentRows.map(row => ({
      organo_dentario: row.toothNumber,
      tratamiento_convencional: row.conventionalTreatment,
      tratamiento_recomendado: row.recommendedTreatment,
      precio_convencional: row.conventionalPrice,
      precio_recomendado: row.recommendedPrice,
    }));
    const body = {
      id_paciente: selectedPatient.id,
      total_convencional: conventionalTotal,
      total_recomendado: recommendedTotal,
      detalles,
    };
    try {
      const res = await fetch("/api/tratamientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Buscar el último tratamiento pendiente del paciente
        const resTrat = await fetch(`/api/tratamientos?paciente_id=${selectedPatient.id}&estado=pendiente&limit=1&sort=desc`);
        const dataTrat = await resTrat.json();
        const lastTreatment = Array.isArray(dataTrat) ? dataTrat[0] : (dataTrat.tratamientos?.[0] || null);
        if (lastTreatment && lastTreatment.id) {
          setApprovalTreatmentId(lastTreatment.id);
          setShowApprovalDialog(true);
        } else {
          toast({ title: "Error", description: "No se pudo obtener el ID del tratamiento recién guardado", variant: "destructive", duration: 2500 });
        }
      } else {
        throw new Error(data.error || "Error al guardar tratamiento");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive", duration: 2500 });
    } finally {
      setIsSavingTreatment(false);
    }
  }

  // Agregar esta función para manejar el clic en un tratamiento
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const handleTreatmentClick = async (treatment: any) => {
    setTreatmentLoading(true);
    if (treatment.estado === "aprobado") {
      let tutor = null;
      if (selectedPatient) {
        const res = await fetch(`/api/tutores?paciente_id=${selectedPatient.id}`);
        const data = await res.json();
        if (Array.isArray(data.tutores)) {
          tutor = data.tutores.find((t: any) => t.id === treatment.aprobado_por_idtutor) || null;
        }
      }
      setApprovedModalData(treatment);
      setApprovedModalTutor(tutor);
      setTimeout(() => {
        setShowApprovedModal(true);
        setShowLoadingModal(false);
        setTreatmentLoading(false); // Aquí se desactiva el loading
      }, 250);
    } else {
      setSelectedTreatmentForEdit(treatment);
      setTimeout(() => {
        setShowTreatmentDetails(true);
        setShowLoadingModal(false);
        setTreatmentLoading(false); // Aquí también
      }, 250);
    }
  }

  // Agregar esta función para manejar el clic en una cita
  const handleAppointmentClick = (appointment: any) => {
    setShowLoadingModal(true);
    setSelectedAppointment(appointment);
    setTimeout(() => {
      setShowAppointmentDetails(true);
      setShowLoadingModal(false);
    }, 250);
  }

  // Agregar esta función para actualizar la lista de tratamientos después de editar
  const handleTreatmentUpdate = () => {
    // Forzar el tipo Patient en el mapeo:
    const updatedPatients = patients.map((patient) => (patient.id === selectedPatient?.id ? selectedPatient as Patient : patient))

    setPatients(updatedPatients)
    storage.setItem("patients", updatedPatients)
    setSelectedTreatmentForEdit(null)
  }

  // Nueva función para recargar solo los tratamientos del historial del paciente
  const reloadPatientTreatments = async () => {
    if (!selectedPatient) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/tratamientos/paciente?paciente_id=${selectedPatient.id}`);
      const data = await res.json();
      setHistoryTreatments(Array.isArray(data.tratamientos) ? data.tratamientos : []);
    } catch {
      setHistoryTreatments([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Handle action buttons
  // Modificar la función handleViewHistory para incluir los tratamientos
  const handleViewHistory = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowHistoryDialog(true)
  }

  const handleScheduleAppointment = (patientId: number, patientName: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedPatientId', String(patientId))
      sessionStorage.setItem('selectedPatientName', patientName)
    }
    // Trigger loading animation
    const startEvent = new Event("next-route-change-start")
    document.dispatchEvent(startEvent)
    setTimeout(() => {
      router.push(`/citas`)
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.localStorage.getItem('openNewPatientModal') === '1') {
        setShowNewPatientDialog(true)
        window.localStorage.removeItem('openNewPatientModal')
      }
    }
  }, [])

  // Cargar citas y tratamientos del paciente seleccionado al abrir el historial
  useEffect(() => {
    if (showHistoryDialog && selectedPatient) {
      setLoadingHistory(true)
      Promise.all([
        fetch(`/api/citas/paciente?paciente_id=${selectedPatient.id}`).then(r => r.json()),
        fetch(`/api/tratamientos/paciente?paciente_id=${selectedPatient.id}`).then(r => r.json()),
      ])
        .then(([citasRes, tratamientosRes]) => {
          setHistoryAppointments(Array.isArray(citasRes.citas) ? citasRes.citas : [])
          setHistoryTreatments(Array.isArray(tratamientosRes.tratamientos) ? tratamientosRes.tratamientos : [])
        })
        .finally(() => setLoadingHistory(false))
    } else if (!showHistoryDialog) {
      setHistoryAppointments([])
      setHistoryTreatments([])
    }
  }, [showHistoryDialog, selectedPatient])

  // Navegar a la página de citas y abrir el modal de confirmación
  const handleGoToConfirmAppointment = (appointment: any) => {
    setShowAppointmentDetails(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('selectedAppointmentId', appointment.id.toString())
    }
    router.push('/citas')
  }

  return (
    <div className="space-y-6">
      {showLoadingModal && <LoadingSpinner size="md" />}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0) // Ir a la primera página al buscar
                }}
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
                            onClick={() => handleScheduleAppointment(patient.id, patient.name)}
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
                          <Button
                            variant="outline"
                            size="icon"
                            title="Registrar Tutor"
                            onClick={() => {
                              setSelectedTutorPatient(patient)
                              setShowTutorModal(true)
                            }}
                          >
                            <Fingerprint className="h-4 w-4" />
                            <span className="sr-only">Registrar Tutor</span>
                          </Button>
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
          {/* Spinner de carga SOLO dentro del modal de historial, para citas/tratamientos */}
          {(treatmentLoading || showLoadingModal) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100%',
            }}>
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-2" />
                <div className="text-lg font-semibold text-blue-700">
                  {(showAppointmentDetails || (selectedAppointment && showLoadingModal)) ? 'Cargando cita' : 'Cargando tratamiento'}
                </div>
              </div>
            </div>
          )}
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
                    <strong>Última visita:</strong> {selectedPatient.lastVisit ? format(new Date(selectedPatient.lastVisit), "d 'de' MMMM, yyyy h:mm a", { locale: es }) : "-"}
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
                {loadingHistory ? (
                  <p className="text-muted-foreground">Cargando citas...</p>
                ) : historyAppointments.length === 0 ? (
                  <p>No hay citas registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {historyAppointments.map((appointment: any) => {
                      const dateObj = new Date(appointment.fecha_hora)
                      const formattedDate = format(dateObj, "d 'de' MMMM, yyyy", { locale: es })
                      const formattedTime = format(dateObj, "h:mm a", { locale: es })
                      let estadoBadge = null
                      if (appointment.estado === "cancelada") {
                        estadoBadge = <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Cancelada</span>
                      } else if (appointment.estado === "confirmada") {
                        estadoBadge = <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Confirmada</span>
                      } else {
                        estadoBadge = <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Pendiente</span>
                      }
                      return (
                        <div
                          key={appointment.id}
                          className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colores"
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${appointment.estado === "confirmada" ? "bg-green-200 text-green-600" : appointment.estado === "cancelada" ? "bg-red-200 text-red-600" : "bg-blue-200 text-blue-600"}`}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{appointment.tipo || "Consulta general"}</p>
                              <p className="text-xs text-muted-foreground">{formattedDate} - {formattedTime}</p>
                            </div>
                          </div>
                          <div>
                            {estadoBadge}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <h4 className="font-semibold mt-4 section-title">Historial de Tratamientos</h4>
                {loadingHistory ? (
                  <p className="text-muted-foreground">Cargando tratamientos...</p>
                ) : historyTreatments.length === 0 ? (
                  <p>No hay tratamientos registrados.</p>
                ) : (
                  <div className="space-y-2">
                    {historyTreatments.map((treatment: any) => {
                      const dateObj = new Date(treatment.fecha_creacion)
                      const formattedDate = format(dateObj, "d 'de' MMMM, yyyy", { locale: es })
                      const formattedTime = format(dateObj, "HH:mm", { locale: es })
                      return (
                        <div
                         
                          key={treatment.id}
                          className="border rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-muted/50 transition-colores"
                          onClick={() => handleTreatmentClick(treatment)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${treatment.estado === "aprobado" ? "bg-green-200 text-green-600" : "bg-amber-200 text-amber-600"}`}>
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Tratamiento</p>
                              <p className="text-xs text-muted-foreground">{formattedDate} - {formattedTime}</p>
                            </div>
                          </div>
                          <div>
                            {treatment.estado === "aprobado" ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Aprobado</span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Pendiente</span>
                            )}
                          </div>
                        </div>
                                           )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-2">
            <Button onClick={() => setShowHistoryDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Additional Info Dialog */}
      <AdditionalInfoDialog
        open={showAdditionalInfoDialog}
        onOpenChange={setShowAdditionalInfoDialog}
        selectedPatient={selectedPatient ? { ...selectedPatient, id: String(selectedPatient.id) } : null}
        editPatientInfo={editPatientInfo}
        setEditPatientInfo={setEditPatientInfo}
        showTermsDialog={showTermsDialog}
        setShowTermsDialog={setShowTermsDialog}
      />

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

      <PatientTreatmentsSection
        showTreatmentDialog={showTreatmentDialog}
        setShowTreatmentDialog={setShowTreatmentDialog}
        showApprovalDialog={showApprovalDialog}
        setShowApprovalDialog={setShowApprovalDialog}
        selectedPatient={selectedPatient}
        currentTreatmentRows={currentTreatmentRows}
        setCurrentTreatmentRows={setCurrentTreatmentRows}
        conventionalTotal={conventionalTotal}
        setConventionalTotal={setConventionalTotal}
        recommendedTotal={recommendedTotal}
        setRecommendedTotal={setRecommendedTotal}
        selectedTreatmentType={selectedTreatmentType}
        setSelectedTreatmentType={setSelectedTreatmentType}
        fingerprintData={fingerprintData}
        setFingerprintData={setFingerprintData}
        handleTreatmentUpdateRows={handleTreatmentUpdateRows}
        handleSaveTreatment={handleSaveTreatment}
        handleApprovalRequest={handleApprovalRequest}
        isSavingTreatment={isSavingTreatment}
        setIsSavingTreatment={setIsSavingTreatment}
        currentTreatmentId={approvalTreatmentId || 0}
      />

      {/* Agregar estos componentes al final del componente principal, justo antes del cierre final */}
      <AppointmentDetails
        appointment={selectedAppointment}
        open={showAppointmentDetails}
        onOpenChange={setShowAppointmentDetails}
        onGoToConfirm={handleGoToConfirmAppointment}
      />

      <TreatmentDetails
        treatment={selectedTreatmentForEdit}
        patient={selectedPatient}
        open={showTreatmentDetails}
        onOpenChange={setShowTreatmentDetails}
        onUpdate={() => {
          handleTreatmentUpdate();
          reloadPatientTreatments();
        }}
      />
      <PatientTreatmentsApprovedModal
        open={showApprovedModal}
        onOpenChange={setShowApprovedModal}
        treatment={approvedModalData}
        patient={selectedPatient}
        tutor={approvedModalTutor}
      />
      {/* Tutor Modal */}
      {selectedTutorPatient && (
        <TutorModal
          open={showTutorModal}
          onClose={() => setShowTutorModal(false)}
          paciente={selectedTutorPatient}
        />
      )}
    </div>
  )
}