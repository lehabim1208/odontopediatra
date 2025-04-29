"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react"
import { storage } from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FingerprintCapture } from "./fingerprint-capture"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface TreatmentRow {
  id: string
  toothNumber: string
  conventionalTreatment: string
  recommendedTreatment: string
  conventionalPrice: number
  recommendedPrice: number
}

interface TreatmentDetailsProps {
  treatment: any
  patient: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function TreatmentDetails({ treatment, patient, open, onOpenChange, onUpdate }: TreatmentDetailsProps) {
  const { toast } = useToast()
  const [rows, setRows] = useState<TreatmentRow[]>([])
  const [conventionalTotal, setConventionalTotal] = useState(0)
  const [recommendedTotal, setRecommendedTotal] = useState(0)

  const [selectedTreatmentType, setSelectedTreatmentType] = useState<"conventional" | "recommended">("conventional")
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)
  const [fingerprintError, setFingerprintError] = useState<string | null>(null)
  const [showTermsDialog, setShowTermsDialog] = useState(false)

  // Cargar los datos del tratamiento cuando se abre el modal
  useEffect(() => {
    if (treatment && open) {
      // Cargar los datos del tratamiento seleccionado
      setRows(treatment.rows || [])
      setConventionalTotal(treatment.conventionalTotal || 0)
      setRecommendedTotal(treatment.recommendedTotal || 0)

      // Si el tratamiento ya está aprobado, establecer el tipo seleccionado
      if (treatment.status === "approved" && treatment.approvedType) {
        setSelectedTreatmentType(treatment.approvedType)
      }
    }
  }, [treatment, open])

  // Calcular totales cuando cambian las filas
  useEffect(() => {
    const cTotal = rows.reduce((sum, row) => sum + (Number(row.conventionalPrice) || 0), 0)
    const rTotal = rows.reduce((sum, row) => sum + (Number(row.recommendedPrice) || 0), 0)
    setConventionalTotal(cTotal)
    setRecommendedTotal(rTotal)
  }, [rows])

  // Agregar una nueva fila
  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        toothNumber: "",
        conventionalTreatment: "",
        recommendedTreatment: "",
        conventionalPrice: 0,
        recommendedPrice: 0,
      },
    ])
  }

  // Eliminar una fila
  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id))
  }

  // Actualizar una fila
  const updateRow = (id: string, field: keyof TreatmentRow, value: string | number) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value }
        }
        return row
      }),
    )
  }

  // Guardar los cambios en el tratamiento
  const handleSaveChanges = () => {
    if (!treatment || !patient) return

    const treatments = storage.getItem("treatments") || []

    const updatedTreatment = {
      ...treatment,
      rows,
      conventionalTotal,
      recommendedTotal,
    }

    const updatedTreatments = treatments.map((t: any) => (t.id === treatment.id ? updatedTreatment : t))

    storage.setItem("treatments", updatedTreatments)

    toast({
      title: "Éxito",
      description: "Tratamiento actualizado correctamente",
      variant: "success",
      duration: 2500,
    })

    onUpdate()
    onOpenChange(false)
  }

  // Aprobar el tratamiento
  const handleApproveRequest = () => {
    setFingerprintData(null)
    setFingerprintError(null)
    setShowApprovalDialog(true)
  }

  // Capturar huella digital
  const handleFingerprintCapture = (data: string) => {
    setFingerprintData(data)

    // Verificar si ya existe una huella guardada para este tutor
    const patients = storage.getItem("patients") || []
    const currentPatient = patients.find((p: any) => p.id === patient.id)

    if (currentPatient && currentPatient.tutorFingerprint) {
      // Simular verificación de huella
      // En un sistema real, aquí se compararían las huellas digitales
      if (data !== currentPatient.tutorFingerprint) {
        setFingerprintError("La huella digital no coincide con la registrada para este tutor")
      } else {
        setFingerprintError(null)
      }
    } else {
      // Primera vez, no hay error
      setFingerprintError(null)
    }
  }

  // Confirmar aprobación
  const handleApprove = () => {
    if (!treatment || !patient || !fingerprintData) return

    if (fingerprintError) {
      toast({
        title: "Error",
        description: fingerprintError,
        variant: "destructive",
        duration: 2500,
      })
      return
    }

    const treatments = storage.getItem("treatments") || []
    const patients = storage.getItem("patients") || []

    const now = new Date()

    const updatedTreatment = {
      ...treatment,
      rows,
      conventionalTotal,
      recommendedTotal,
      status: "approved",
      approvedType: selectedTreatmentType,
      fingerprintData,
      approvedDate: now.toISOString(),
    }

    const updatedTreatments = treatments.map((t: any) => (t.id === treatment.id ? updatedTreatment : t))

    storage.setItem("treatments", updatedTreatments)

    // Guardar la huella del tutor si es la primera vez
    const currentPatient = patients.find((p: any) => p.id === patient.id)
    if (currentPatient && !currentPatient.tutorFingerprint) {
      const updatedPatients = patients.map((p: any) => {
        if (p.id === patient.id) {
          return {
            ...p,
            tutorFingerprint: fingerprintData,
          }
        }
        return p
      })

      storage.setItem("patients", updatedPatients)
    }

    toast({
      title: "Éxito",
      description: "Tratamiento aprobado correctamente",
      variant: "success",
      duration: 2500,
    })

    setShowApprovalDialog(false)
    onUpdate()
    onOpenChange(false)
  }

  // Generar PDF del tratamiento
  const handleDownloadPDF = () => {
    if (!treatment || !patient) return
    const doc = new jsPDF()
    const margin = 15
    let y = margin

    // Agregar logo antes del título
    const logoUrl = window.location.origin + "/images/logo-emmanuel-severino.png"
    // Proporción original: 5906 x 2165
    const logoWidth = 50
    const logoHeight = (2165 / 5906) * logoWidth // Mantener proporción
    const img = new window.Image()
    img.src = logoUrl
    img.onload = function () {
      doc.addImage(img, "PNG", margin, y, logoWidth, logoHeight)
      y += logoHeight + 4
      // Título en azul
      doc.setFontSize(18)
      doc.setTextColor(41, 128, 185)
      doc.text("Plan de Tratamiento Odontológico", margin, y)
      doc.setTextColor(0, 0, 0)
      y += 10
      // Estado del tratamiento
      doc.setFontSize(12)
      doc.text(
        `Estado: ${treatment.status === "approved" ? "Aprobado" : "Pendiente"}`,
        margin,
        y
      )
      y += 8
      doc.text(
        `Fecha: ${format(new Date(treatment.date), "d 'de' MMMM, yyyy", { locale: es })}  Hora: ${format(
          new Date(treatment.date),
          "HH:mm",
          { locale: es }
        )}`,
        margin,
        y
      )
      y += 8
      if (treatment.status === "approved" && treatment.approvedDate) {
        doc.text(
          `Aprobado el: ${format(new Date(treatment.approvedDate), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`,
          margin,
          y
        )
        y += 8
      }
      // Información del paciente
      doc.setFontSize(14)
      doc.text("Información del Paciente", margin, y)
      y += 8
      doc.setFontSize(12)
      doc.text(`Nombre: ${patient.name}`, margin, y)
      y += 7
      doc.text(`Edad: ${patient.age} años`, margin, y)
      y += 7
      doc.text(`Tutor: ${patient.guardian}`, margin, y)
      y += 10

      // Tabla de tratamientos
      const tableBody = treatment.rows.map((row: any) => [
        row.toothNumber,
        row.conventionalTreatment,
        row.recommendedTreatment,
        `$${Number(row.conventionalPrice).toLocaleString()}`,
        `$${Number(row.recommendedPrice).toLocaleString()}`,
      ])
      autoTable(doc, {
        startY: y,
        head: [[
          "Órgano dentario",
          "Tratamiento convencional",
          "Tratamiento recomendado",
          "Precio conv.",
          "Precio recom.",
        ]],
        body: tableBody,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: margin, right: margin },
      })
      y = (doc as any).lastAutoTable.finalY + 8

      // Totales
      doc.setFontSize(12)
      doc.text(
        `Total tratamiento convencional: $${Number(treatment.conventionalTotal).toLocaleString()}`,
        margin,
        y
      )
      y += 7
      doc.text(
        `Total tratamiento recomendado: $${Number(treatment.recommendedTotal).toLocaleString()}`,
        margin,
        y
      )
      y += 10

      // Hash de verificación si está aprobado
      if (treatment.status === "approved" && treatment.fingerprintData) {
        doc.setFontSize(10)
        doc.text(
          `Hash de verificación: ${treatment.fingerprintData.substring(0, 32)}...`,
          margin,
          y
        )
      }

      doc.save(
        `Tratamiento_${patient.name.replace(/\s+/g, "_")}_${format(
          new Date(treatment.date),
          "yyyyMMdd_HHmm"
        )}.pdf`
      )
    }
    // Si la imagen ya está en caché, puede que onload no se dispare, así que forzar si ya está completa
    if (img.complete) img.onload && img.onload(null as any)
  }

  if (!treatment || !patient) return null

  const treatmentDate = new Date(treatment.date)
  const formattedDate = format(treatmentDate, "d 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(treatmentDate, "HH:mm", { locale: es })

  const isApproved = treatment.status === "approved"
  let approvedDate = null
  if (isApproved && treatment.approvedDate) {
    const approvalDate = new Date(treatment.approvedDate)
    approvedDate = format(approvalDate, "d 'de' MMMM, yyyy HH:mm", { locale: es })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Detalle del Tratamiento</DialogTitle>
            <DialogDescription>
              {`Tratamiento de ${patient.name} - ${formattedDate} ${formattedTime}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="space-y-6 p-1">
              {isApproved && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-400">Tratamiento Aprobado</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Este tratamiento fue aprobado el {approvedDate}.<br />
                    Tipo de tratamiento:{" "}
                    <strong>{treatment.approvedType === "conventional" ? "Convencional" : "Recomendado"}</strong>
                    <br />
                    Hash de verificación:{" "}
                    <code className="bg-green-100 dark:bg-green-900/40 px-1 py-0.5 rounded text-xs">
                      {treatment.fingerprintData?.substring(0, 20)}...
                    </code>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Información del Paciente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Paciente:</strong> {patient.name}
                    </p>
                    <p>
                      <strong>Edad:</strong> {patient.age} años
                    </p>
                    <p>
                      <strong>Tutor:</strong> {patient.guardian}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Fecha:</strong> {formattedDate}
                    </p>
                    <p>
                      <strong>Hora:</strong> {formattedTime}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      <span className={isApproved ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                        {isApproved ? "Aprobado" : "Pendiente"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-1">Plan de Tratamiento</h3>
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Órgano dentario</TableHead>
                          <TableHead>Tratamiento convencional</TableHead>
                          <TableHead>Tratamiento recomendado</TableHead>
                          <TableHead className="w-[120px]">Precio conv.</TableHead>
                          <TableHead className="w-[120px]">Precio recom.</TableHead>
                          {!isApproved && <TableHead className="w-[80px]"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              {isApproved ? (
                                <span>{row.toothNumber}</span>
                              ) : (
                                <Input
                                  value={row.toothNumber}
                                  onChange={(e) => updateRow(row.id, "toothNumber", e.target.value)}
                                  placeholder="Ej: 11"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isApproved ? (
                                <span>{row.conventionalTreatment}</span>
                              ) : (
                                <Input
                                  value={row.conventionalTreatment}
                                  onChange={(e) => updateRow(row.id, "conventionalTreatment", e.target.value)}
                                  placeholder="Tratamiento convencional"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isApproved ? (
                                <span>{row.recommendedTreatment}</span>
                              ) : (
                                <Input
                                  value={row.recommendedTreatment}
                                  onChange={(e) => updateRow(row.id, "recommendedTreatment", e.target.value)}
                                  placeholder="Tratamiento recomendado"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isApproved ? (
                                <span>${Number(row.conventionalPrice).toLocaleString()}</span>
                              ) : (
                                <Input
                                  type="number"
                                  value={row.conventionalPrice}
                                  onChange={(e) => updateRow(row.id, "conventionalPrice", Number(e.target.value))}
                                  placeholder="$0"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isApproved ? (
                                <span>${Number(row.recommendedPrice).toLocaleString()}</span>
                              ) : (
                                <Input
                                  type="number"
                                  value={row.recommendedPrice}
                                  onChange={(e) => updateRow(row.id, "recommendedPrice", Number(e.target.value))}
                                  placeholder="$0"
                                />
                              )}
                            </TableCell>
                            {!isApproved && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRow(row.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {!isApproved && (
                    <Button variant="outline" size="sm" onClick={addRow} className="mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Agregar tratamiento
                    </Button>
                  )}

                  {/* Centrar mejor los totales */}
                  <div className="flex justify-center items-center mt-6 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-12 w-full max-w-xl">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total tratamiento convencional:</p>
                        <p className="text-xl font-semibold">${conventionalTotal.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total tratamiento recomendado:</p>
                        <p className="text-xl font-semibold">${recommendedTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cerrar
            </Button>
            <Button onClick={handleDownloadPDF} className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
              Descargar PDF
            </Button>
            {!isApproved && (
              <>
                <Button onClick={handleSaveChanges} className="w-full sm:w-auto">
                  Guardar Cambios
                </Button>
                <Button onClick={handleApproveRequest} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                  Aprobar Tratamiento
                </Button>
              </>
            )}
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

            {fingerprintError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de verificación</AlertTitle>
                <AlertDescription>{fingerprintError}</AlertDescription>
              </Alert>
            )}

            {/* Agregar términos y condiciones aquí */}
            <div className="mt-4 text-center">
              <Button variant="link" className="text-primary underline" onClick={() => setShowTermsDialog(true)}>
                Leer términos y condiciones
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!fingerprintData || !!fingerprintError}
              className="w-full sm:w-auto"
            >
              Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    </>
  )
}
