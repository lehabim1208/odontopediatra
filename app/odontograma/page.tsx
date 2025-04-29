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

export default function OdontogramaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedPatientId } = usePatient()
  const [patient, setPatient] = useState<any>(null)
  const [savedDates, setSavedDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("current")
  const [defaultDentitionType, setDefaultDentitionType] = useState<"adult" | "child">("child") // Cambiado a "child" por defecto
  const [isDefaultDentitionChanged, setIsDefaultDentitionChanged] = useState(false)

  useEffect(() => {
    if (!selectedPatientId) {
      router.push("/pacientes")
      return
    }

    const patients = storage.getItem("patients") || []
    const foundPatient = patients.find((p: any) => p.id.toString() === selectedPatientId)
    if (foundPatient) {
      setPatient(foundPatient)

      // Cargar la preferencia de dentición para este paciente
      const patientPreferences = storage.getItem(`patient-preferences-${selectedPatientId}`) || {}
      if (patientPreferences.defaultDentitionType) {
        setDefaultDentitionType(patientPreferences.defaultDentitionType)
      } else {
        // Si no hay preferencia guardada, usar "child" como predeterminado
        setDefaultDentitionType("child")
      }
    }

    // Cargar las fechas de odontogramas guardados
    loadSavedDates()
  }, [selectedPatientId, router])

  const loadSavedDates = () => {
    if (!selectedPatientId) return

    // Buscar todas las entradas en localStorage que contengan odontogramas del paciente
    const dates: string[] = []

    // Buscar odontogramas de adultos
    const adultOdontograms = storage.getItem(`odontogram-history-${selectedPatientId}-adult`) || []
    if (Array.isArray(adultOdontograms)) {
      adultOdontograms.forEach((item: any) => {
        if (item.date && !dates.includes(item.date)) {
          dates.push(item.date)
        }
      })
    }

    // Buscar odontogramas pediátricos
    const childOdontograms = storage.getItem(`odontogram-history-${selectedPatientId}-child`) || []
    if (Array.isArray(childOdontograms)) {
      childOdontograms.forEach((item: any) => {
        if (item.date && !dates.includes(item.date)) {
          dates.push(item.date)
        }
      })
    }

    // Ordenar las fechas de más reciente a más antigua
    dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    setSavedDates(dates)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  const handleDefaultDentitionChange = (checked: boolean) => {
    const newDentitionType = checked ? "child" : "adult"
    setDefaultDentitionType(newDentitionType)
    setIsDefaultDentitionChanged(true)

    // Guardar la preferencia para este paciente
    const patientPreferences = storage.getItem(`patient-preferences-${selectedPatientId}`) || {}
    storage.setItem(`patient-preferences-${selectedPatientId}`, {
      ...patientPreferences,
      defaultDentitionType: newDentitionType,
    })

    toast({
      title: "Preferencia guardada",
      description: `La dentición predeterminada para este paciente ahora es ${newDentitionType === "adult" ? "Adulto" : "Infantil"}`,
      variant: "success",
      duration: 2500,
    })
  }

  const handleDownloadPDF = () => {
    if (!patient) return

    // Notificar al componente Odontograma que debe generar el PDF
    const event = new CustomEvent("download-odontogram-pdf", {
      detail: {
        patientName: patient.name,
        patientAge: patient.age,
        date: format(new Date(), "d 'de' MMMM, yyyy", { locale: es }),
      },
    })
    document.dispatchEvent(event)
  }

  if (!selectedPatientId) {
    return (
      <div className="p-6 md:p-10">
        <div className="text-center py-8">
          <p>No se ha seleccionado ningún paciente</p>
          <Button className="mt-4" onClick={() => router.push("/pacientes")}>
            Volver a Pacientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary brand-name">Odontograma Digital</h1>
          {patient && <p className="text-muted-foreground">Paciente: {patient.name}</p>}
        </div>

        <Button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700" variant="default">
          <Download className="h-4 w-4" /> Descargar PDF
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
            {selectedPatientId ? (
              <Odontograma
                patientId={selectedPatientId}
                readOnly={selectedDate !== "current"}
                historicalDate={selectedDate !== "current" ? selectedDate : undefined}
                defaultDentitionType={defaultDentitionType}
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
