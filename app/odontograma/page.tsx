"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { storage } from "@/lib/storage"
import { Odontograma } from "@/components/odontograma"
import { useToast } from "@/components/ui/use-toast"
import { usePatient } from "@/components/patient-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function OdontogramaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedPatientId } = usePatient()
  const [patient, setPatient] = useState<any>(null)
  const [savedDates, setSavedDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("current")
  const [defaultDentitionType, setDefaultDentitionType] = useState<"adult" | "child">("child")
  const [odontogramas, setOdontogramas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [odontogramaData, setOdontogramaData] = useState<any>(null)
  const [notas, setNotas] = useState("")
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!selectedPatientId) {
      router.push("/pacientes")
      return
    }
    setLoading(true)
    // Consultar la API de pacientes
    fetch(`/api/pacientes?id=${selectedPatientId}`)
      .then(res => res.json())
      .then((data) => {
        setPatient(data)
      })
      .catch(() => setPatient(null))
    // 1. Consultar solo el odontograma más reciente
    fetch(`/api/odontograma?id_paciente=${selectedPatientId}&latest=1`)
      .then(res => res.json())
      .then((data) => {
        setOdontogramas(data || [])
        setLoading(false)
      })
      .catch(() => {
        setOdontogramas([])
        setLoading(false)
      })
  }, [selectedPatientId, router])

  // Segunda consulta: historial completo, solo después de mostrar el más reciente
  useEffect(() => {
    if (!loading && odontogramas.length > 0) {
      fetch(`/api/odontograma?id_paciente=${selectedPatientId}`)
        .then(res => res.json())
        .then((allData) => {
          if (Array.isArray(allData) && allData.length > 0) {
            setOdontogramas(allData)
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, selectedPatientId])

  useEffect(() => {
    if (!odontogramas.length) {
      setSavedDates([])
      setOdontogramaData(null)
      setNotas("")
      return
    }
    const fechas = odontogramas.map((o) => o.fecha_hora)
    setSavedDates(fechas)
    if (selectedDate === "current" || !fechas.includes(selectedDate)) {
      const vector = odontogramas[0]?.json_vector
      let parsedVector = null
      if (vector) {
        parsedVector = typeof vector === "string" ? JSON.parse(vector) : vector
      }
      setOdontogramaData(parsedVector)
      setNotas(odontogramas[0]?.notas || "")
    } else {
      const od = odontogramas.find((o) => o.fecha_hora === selectedDate)
      let parsedVector = null
      if (od?.json_vector) {
        parsedVector = typeof od.json_vector === "string" ? JSON.parse(od.json_vector) : od.json_vector
      }
      setOdontogramaData(parsedVector)
      setNotas(od?.notas || "")
    }
  }, [odontogramas, selectedDate])

  useEffect(() => {
    const handlePdfDone = () => setPdfLoading(false)
    document.addEventListener("odontogram-pdf-done", handlePdfDone)
    return () => document.removeEventListener("odontogram-pdf-done", handlePdfDone)
  }, [])

  // Recargar odontogramas desde la base de datos
  const reloadOdontogramas = () => {
    setLoading(true)
    fetch(`/api/odontograma?id_paciente=${selectedPatientId}`)
      .then(res => res.json())
      .then((data) => {
        setOdontogramas(data || [])
        setLoading(false)
      })
      .catch(() => {
        setOdontogramas([])
        setLoading(false)
      })
  }

  // Handler para cuando se guarda el odontograma
  const handleOdontogramaSave = () => {
    reloadOdontogramas()
    toast({
      title: "Éxito",
      description: "Odontograma guardado correctamente",
      variant: "success",
      duration: 2500,
    })
    setSelectedDate("current")
  }

  const handleDownloadPDF = () => {
    if (!patient) return
    setPdfLoading(true)
    const event = new CustomEvent("download-odontogram-pdf", {
      detail: {
        patientName: patient.nombre || patient.name || "",
        patientAge: patient.edad || patient.age || "",
        tutor: patient.tutor || patient.tutor_nombre || "",
        date: format(new Date(), "d 'de' MMMM, yyyy", { locale: es }),
      },
    })
    document.dispatchEvent(event)
  }

  const handleDefaultDentitionChange = (checked: boolean) => {
    const newDentitionType = checked ? "child" : "adult"
    setDefaultDentitionType(newDentitionType)
    // Aquí podrías guardar la preferencia en la BD si lo deseas
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return dateString
    }
  }


  if (!selectedPatientId) {
    return (
      <div className="p-6 md:p-10">
        <div className="text-center py-8">
          <p>No se ha seleccionado ningún paciente</p>
          <Button className="mt-4" onClick={() => router.push("/pacientes")}>Volver a Pacientes</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary brand-name">Odontograma Digital</h1>
          {/* Mostrar el nombre, edad y tutor del paciente si están disponibles */}
          {(patient?.nombre || patient?.name || patient?.edad || patient?.age || patient?.tutor || patient?.tutor_nombre || patient?.guardian) && (
            <div className="mb-2 font-bold text-blue-600">
              {(patient?.nombre || patient?.name) && <span>Paciente: {patient?.nombre || patient?.name} </span>}
              {(patient?.edad || patient?.age) && <span>| Edad: {patient?.edad || patient?.age} </span>}
            </div>
          )}
        </div>
        <Button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700" variant="default" disabled={pdfLoading}>
          {pdfLoading ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />} Descargar PDF
        </Button>
      </div>
      <div className="grid gap-6 grid-cols-1">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="section-title">Edición de odontograma</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="default-dentition">Predeterminado:</Label>
                <div className="flex items-center space-x-2">
                  <span>Adulto</span>
                  <Switch
                    id="default-dentition"
                    checked={defaultDentitionType === "child"}
                    onCheckedChange={handleDefaultDentitionChange}
                  />
                  <span>Infantil</span>
                </div>
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Seleccionar fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Odontograma actual</SelectItem>
                  {savedDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : selectedPatientId ? (
              <Odontograma
                patientId={selectedPatientId}
                patientName={patient?.nombre || patient?.name || ""}
                patientAge={patient?.edad || patient?.age || ""}
                tutor={patient?.tutor || patient?.tutor_nombre || ""}
                readOnly={selectedDate !== "current"}
                historicalDate={selectedDate !== "current" ? selectedDate : undefined}
                defaultDentitionType={defaultDentitionType}
                value={odontogramaData}
                notas={notas}
                onSave={handleOdontogramaSave}
              />
            ) : (
              <div className="text-center py-8">
                <p>Seleccione un paciente para ver el odontograma</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
