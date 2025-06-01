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
import { Plus, Trash2, AlertCircle, CheckCircle2, Fingerprint, Info } from "lucide-react"
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

  // --- NUEVO: Estados para flujo de huella y polling ---
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null)
  const [selectedFinger, setSelectedFinger] = useState<string>("pulgar_derecho")
  const [taskId, setTaskId] = useState<number | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // --- MODAL DE APROBACIÓN DE HUELLA (idéntico a PatientTreatmentsSection, pero local) ---
  const [tutors, setTutors] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [fingerName, setFingerName] = useState<string>("");
  const [fingerLoading, setFingerLoading] = useState(false);
  const [fingerError, setFingerError] = useState<string>("");
  const [approvalStep, setApprovalStep] = useState<'idle' | 'creating' | 'waiting' | 'success' | 'error'>('idle');
  const [pollingState, setPollingState] = useState<string>('');
  const [pollingResult, setPollingResult] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvedTreatmentType, setApprovedTreatmentType] = useState<'convencional'|'recomendado'>('convencional');

  // Estados para loading de botones
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper functions for modal UI
  function formatFingerName(finger: string) {
    switch (finger) {
      case "indice_derecho": return "Índice derecho";
      case "indice_izquierdo": return "Índice izquierdo";
      case "pulgar_derecho": return "Pulgar derecho";
      case "pulgar_izquierdo": return "Pulgar izquierdo";
      default:
        return finger.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  function getFingerprintColor(state: string) {
    if (state === "completado") return "text-green-500";
    if (state === "fallido" || state === "error") return "text-red-500";
    return "animate-fingerprint-pulse text-blue-500";
  }

  // Obtener tutores del paciente
  const fetchTutors = async () => {
    if (!patient?.id) return;
    setTutorsLoading(true);
    try {
      const res = await fetch(`/api/tutores?paciente_id=${patient.id}`);
      const data = await res.json();
      setTutors(data.tutores || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTutorsLoading(false);
    }
  };

  useEffect(() => {
    if (showApprovalDialog) {
      fetchTutors();
    }
  }, [showApprovalDialog]);

  useEffect(() => {
    if (tutors.length === 1) {
      setSelectedTutorId(tutors[0].id);
    }
  }, [tutors]);

  useEffect(() => {
    const fetchFinger = async () => {
      if (!selectedTutorId) return;
      setFingerLoading(true);
      setFingerError("");
      try {
        const res = await fetch(`/api/huellas?tutor_id=${selectedTutorId}`);
        const data = await res.json();
        if (res.status === 404 || data.error) {
          setFingerName("");
          setFingerError("No se encontró una huella registrada para este tutor. Solicite el registro de huella antes de aprobar.");
        } else {
          setFingerName(data.dedo || "");
          setFingerError("");
        }
      } catch (e) {
        setFingerName("");
        setFingerError("Error al consultar la huella del tutor. Intente de nuevo o contacte a soporte.");
      } finally {
        setFingerLoading(false);
      }
    };
    fetchFinger();
  }, [selectedTutorId]);

  const handleStartApproval = async () => {
    setApprovalStep('creating');
    setApprovalError("");
    setPollingState("");
    setPollingResult("");
    try {
      const res = await fetch("/api/huellas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: selectedTutorId,
          tipo: "comparacion",
          dedo: fingerName,
          id_tratamiento: treatment.id,
          tratamiento_aprobado: approvedTreatmentType,
        }),
      });
      const data = await res.json();
      if (data.success && data.task_id) {
        setApprovalStep('waiting');
        pollForApproval(data.task_id);
      } else {
        setApprovalStep('error');
        setApprovalError(data.error || "No se pudo crear la tarea de huella");
      }
    } catch (e: any) {
      setApprovalStep('error');
      setApprovalError(e.message);
    }
  };

  const pollForApproval = (taskId: number) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/huellas?task_id=${taskId}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setApprovalStep('error');
          setApprovalError("Error de red o del servidor. Intenta de nuevo.");
          clearInterval(interval);
          return;
        }
        const data = await res.json();
        setPollingState(data.estado);
        if (data.completed && data.resultado) {
          setApprovalStep('success');
          setPollingResult(data.resultado);
          // Guardar aprobación en backend
          await fetch(`/api/tratamientos/${treatment.id}/aprobar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estado: "aprobado",
              aprobacion: data.resultado,
              fecha_aprobado: new Date().toISOString(),
              aprobado_por_idtutor: selectedTutorId,
              tratamiento_aprobado: approvedTreatmentType,
              total_convencional: conventionalTotal,
              total_recomendado: recommendedTotal,
            }),
          });
          clearInterval(interval);
        } else if (data.failed) {
          setApprovalStep('error');
          setApprovalError(data.resultado || "La huella no coincide o fue rechazada.");
          clearInterval(interval);
        } else if (attempts > 60) {
          if (taskId) {
            await fetch("/api/huellas", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ task_id: taskId }),
            });
          }
          setApprovalStep('error');
          setApprovalError("Tiempo de espera agotado para la verificación de huella");
          clearInterval(interval);
        }
      } catch (e: any) {
        setApprovalStep('error');
        setApprovalError("Error de red o del servidor. Intenta de nuevo.");
        clearInterval(interval);
      }
    }, 2000);
  };

  useEffect(() => {
    if (!showApprovalDialog) {
      setSelectedTutorId(null);
      setSelectedFinger("pulgar_derecho");
      setIsPolling(false);
      setTaskId(null);
      setApprovalStep('idle');
      setPollingState('');
      setPollingResult(null);
      setApprovalError(null);
    }
  }, [showApprovalDialog]);

  // Cargar los datos del tratamiento cuando se abre el modal
  useEffect(() => {
    if (treatment && open) {
      if (Array.isArray(treatment.rows) && treatment.rows.length > 0) {
        setRows(treatment.rows);
        setConventionalTotal(treatment.conventionalTotal || 0);
        setRecommendedTotal(treatment.recommendedTotal || 0);
      } else if (treatment.id) {
        fetch(`/api/detalle_tratamientos?id_tratamiento=${treatment.id}`)
          .then((res) => res.json())
          .then((data: any) => {
            if (Array.isArray(data.detalles)) {
              const detRows = data.detalles.map((d: any) => ({
                id: d.id.toString(),
                toothNumber: d.organo_dentario,
                conventionalTreatment: d.tratamiento_convencional,
                recommendedTreatment: d.tratamiento_recomendado,
                conventionalPrice: Number(d.precio_convencional),
                recommendedPrice: Number(d.precio_recomendado),
              }));
              setRows(detRows);
              setConventionalTotal(detRows.reduce((sum: number, row: any) => sum + (row.conventionalPrice || 0), 0));
              setRecommendedTotal(detRows.reduce((sum: number, row: any) => sum + (row.recommendedPrice || 0), 0));
            }
            setConventionalTotal(treatment.total_convencional || treatment.conventionalTotal || 0);
            setRecommendedTotal(treatment.total_recomendado || treatment.recommendedTotal || 0);
          })
          .catch(() => {
            toast({ title: "Error", description: "No se pudieron cargar los detalles del tratamiento", variant: "destructive" });
          });
      } else {
        setConventionalTotal(treatment.total_convencional || treatment.conventionalTotal || 0);
        setRecommendedTotal(treatment.total_recomendado || treatment.recommendedTotal || 0);
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
  const handleSaveChanges = async () => {
    if (!treatment || !patient) return;
    setIsSaving(true);
    // Construir el cuerpo para la API
    const detalles = rows.map(row => ({
      id: row.id,
      organo_dentario: row.toothNumber,
      tratamiento_convencional: row.conventionalTreatment,
      tratamiento_recomendado: row.recommendedTreatment,
      precio_convencional: row.conventionalPrice,
      precio_recomendado: row.recommendedPrice,
    }));

    const body = {
      id_tratamiento: treatment.id,
      id_paciente: patient.id,
      total_convencional: conventionalTotal,
      total_recomendado: recommendedTotal,
      detalles,
    };

    try {
      const res = await fetch("/api/tratamientos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al actualizar tratamiento");
      toast({
        title: "Éxito",
        description: "Tratamiento actualizado correctamente",
        variant: "success",
        duration: 2500,
      });
      setIsSaving(false);
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      setIsSaving(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 2500,
      });
    }
  }

  // Aprobar el tratamiento
  const handleApproveRequest = async () => {
    // Guardar cambios en la BD antes de aprobar
    if (!treatment || !patient) return;
    setIsApproving(true);
    const detalles = rows.map(row => ({
      id: row.id,
      organo_dentario: row.toothNumber,
      tratamiento_convencional: row.conventionalTreatment,
      tratamiento_recomendado: row.recommendedTreatment,
      precio_convencional: row.conventionalPrice,
      precio_recomendado: row.recommendedPrice,
    }));
    const body = {
      id_tratamiento: treatment.id,
      id_paciente: patient.id,
      total_convencional: conventionalTotal,
      total_recomendado: recommendedTotal,
      detalles,
    };
    try {
      const res = await fetch("/api/tratamientos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al actualizar tratamiento");
      setFingerprintData(null);
      setFingerprintError(null);
      onOpenChange(false);
      setApprovalStep('idle');
      setPollingState('');
      setPollingResult(null);
      setApprovalError(null);
      setSelectedTutorId(null);
      setFingerName("");
      setFingerError("");
      setTaskId(null);
      setIsPolling(false);
      setShowApprovalDialog(true);
      setIsApproving(false);
    } catch (error: any) {
      setIsApproving(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
        duration: 2500,
      });
    }
  }

  // Generar PDF del tratamiento
  const handleDownloadPDF = () => {
    if (!treatment || !patient) return;
    setIsDownloading(true);
    const doc = new jsPDF();
    const margin = 15;
    let y = margin;
    const logoUrl = window.location.origin + "/images/logo-emmanuel-severino.png";
    const logoWidth = 50;
    const logoHeight = (2165 / 5906) * logoWidth;
    const img = new window.Image();
    img.src = logoUrl;
    img.onload = function () {
      doc.addImage(img, "PNG", margin, y, logoWidth, logoHeight);
      y += logoHeight + 4;
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text("Plan de Tratamiento Odontológico", margin, y);
      doc.setTextColor(0, 0, 0);
      y += 10;
      doc.setFontSize(12);
      doc.text(
        `Estado: ${treatment.status === "approved" ? "Aprobado" : "Pendiente"}`,
        margin,
        y
      );
      y += 8;
      // Usar formattedDate y formattedTime ya calculados y seguros
      doc.text(
        `Fecha: ${formattedDate}  Hora: ${formattedTime}`,
        margin,
        y
      );
      y += 8;
      if (treatment.status === "approved" && treatment.approvedDate) {
        doc.text(
          `Aprobado el: ${format(new Date(treatment.approvedDate), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`,
          margin,
          y
        );
        y += 8;
      }
      doc.setFontSize(14);
      doc.text("Información del Paciente", margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.text(`Nombre: ${patient.name}`, margin, y);
      y += 7;
      doc.text(`Edad: ${patient.age} años`, margin, y);
      y += 7;
      doc.text(`Tutor: ${patient.guardian}`, margin, y);
      y += 10;
      const tableBody = (treatment.rows || rows).map((row: any) => [
        row.toothNumber,
        row.conventionalTreatment,
        row.recommendedTreatment,
        `$${Number(row.conventionalPrice).toLocaleString()}`,
        `$${Number(row.recommendedPrice).toLocaleString()}`,
      ]);
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
      });
      y = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(12);
      doc.text(
        `Total tratamiento convencional: $${Number(treatment.conventionalTotal ?? conventionalTotal).toLocaleString()}`,
        margin,
        y
      );
      y += 7;
      doc.text(
        `Total tratamiento recomendado: $${Number(treatment.recommendedTotal ?? recommendedTotal).toLocaleString()}`,
        margin,
        y
      );
      y += 10;
      if (treatment.status === "approved" && treatment.fingerprintData) {
        doc.setFontSize(10);
        doc.text(
          `Hash de verificación: ${treatment.fingerprintData.substring(0, 32)}...`,
          margin,
          y
        );
      }
      // Usar treatmentDate para el nombre del archivo
      const safeDate = treatmentDate && !isNaN(treatmentDate.getTime()) ? treatmentDate : new Date();
      doc.save(
        `Tratamiento_${patient.name.replace(/\s+/g, "_")}_${format(
          safeDate,
          "yyyyMMdd_HHmm"
        )}.pdf`
      );
      setIsDownloading(false);
    };
    if (img.complete) img.onload && img.onload(null as any);
  }

  if (!treatment || !patient) return null

  // Usar la fecha de la base de datos (fecha_creacion) si existe
  const treatmentDate = treatment.fecha_creacion
    ? new Date(treatment.fecha_creacion.replace(' ', 'T'))
    : (treatment.date ? new Date(treatment.date) : null);
  const formattedDate = treatmentDate && !isNaN(treatmentDate.getTime())
    ? format(treatmentDate, "d 'de' MMMM, yyyy", { locale: es })
    : "Sin fecha";
  const formattedTime = treatmentDate && !isNaN(treatmentDate.getTime())
    ? format(treatmentDate, "HH:mm", { locale: es })
    : "";

  const isApproved = treatment.status === "approved"
  let approvedDate = null
  if (isApproved && treatment.approvedDate) {
    const approvalDate = new Date(treatment.approvedDate)
    approvedDate = format(approvalDate, "d 'de' MMMM, yyyy HH:mm", { locale: es })
  }

  // --- NUEVO: Polling para verificar tarea de huella ---
  const pollFingerprintTask = (taskId: number) => {
    let attempts = 0
    const maxAttempts = 15 // 30 segundos si el intervalo es 2s
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/huellas?task_id=${taskId}`)
        const data = await res.json()
        if (data.success && data.completed) {
          clearInterval(interval)
          setIsPolling(false)
          await approveTreatmentWithFingerprint(data.resultado)
        } else if (data.success && data.failed) {
          clearInterval(interval)
          setIsPolling(false)
          toast({ title: "Error", description: data.resultado || "La verificación de huella falló", variant: "destructive" })
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setIsPolling(false)
          toast({ title: "Error", description: "No se recibió respuesta", variant: "destructive" })
        }
      } catch {
        clearInterval(interval)
        setIsPolling(false)
        toast({ title: "Error", description: "Error al verificar la tarea de huella", variant: "destructive" })
      }
    }, 2000)
  }

  // --- NUEVO: Función para aprobar tratamiento en backend y refrescar desde backend ---
  const approveTreatmentWithFingerprint = async (hash: string) => {
    if (!treatment || !selectedTutorId) {
      console.error("Faltan datos para aprobar tratamiento", { treatment, selectedTutorId });
      toast({ title: "Error", description: "Faltan datos para aprobar tratamiento", variant: "destructive" });
      return;
    }
    try {
      // Enviar POST al backend con todos los datos requeridos
      const body = {
        id: treatment.id,
        estado: "aprobado",
        aprobacion: hash,
        aprobado_por_idtutor: selectedTutorId,
        fecha_aprobado: new Date().toISOString(),
        tratamiento_aprobado: selectedTreatmentType,
        total_convencional: conventionalTotal,
        total_recomendado: recommendedTotal,
      };
      console.log("POST /api/tratamientos/[id]/aprobar", body);
      const res = await fetch(`/api/tratamientos/${treatment.id}/aprobar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast({ title: "Éxito", description: `Tratamiento aprobado correctamente (filas afectadas: ${data.affectedRows})`, variant: "success" });
        // Limpiar estado del modal de huella
        setApprovalStep('idle');
        setPollingState('');
        setPollingResult(null);
        setApprovalError(null);
        setSelectedTutorId(null);
        setFingerName("");
        setFingerError("");
        setTaskId(null);
        setIsPolling(false);
        setShowApprovalDialog(false);
        // Recargar historial del paciente
        onUpdate();
        // Asegurarse de cerrar el modal de detalles (por si acaso)
        onOpenChange(false);
      } else {
        console.error("Error POST /api/tratamientos/[id]/aprobar", data);
        toast({ title: "Error", description: data.error || "No se pudo aprobar el tratamiento", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Error en approveTreatmentWithFingerprint", e);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  // --- NUEVO: Función para iniciar tarea de huella ---
  const startFingerprintApproval = async () => {
    if (!patient || !treatment) return
    if (!selectedTutorId) {
      toast({ title: "Selecciona un tutor", variant: "destructive" })
      return
    }
    setIsPolling(true)
    try {
      const res = await fetch("/api/huellas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: selectedTutorId,
          dedo: selectedFinger,
          tipo: "comparacion",
          id_tratamiento: treatment.id,
        }),
      })
      const data = await res.json()
      if (data.success && data.task_id) {
        setTaskId(data.task_id)
        pollFingerprintTask(data.task_id)
      } else {
        setIsPolling(false)
        toast({ title: "Error", description: data.error || "No se pudo iniciar la tarea de huella", variant: "destructive" })
      }
    } catch (e: any) {
      setIsPolling(false)
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
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
                    <br />
                    {/* Detalle del tratamiento */}
                    <div className="mt-2">
                      <strong>Detalle del tratamiento:</strong>
                      <ul className="list-disc ml-6">
                        {Array.isArray(treatment.rows) && treatment.rows.map((row: any) => (
                          <li key={row.id}>
                            Órgano: {row.toothNumber}, Convencional: {row.conventionalTreatment} (${Number(row.conventionalPrice).toLocaleString()}), Recomendado: {row.recommendedTreatment} (${Number(row.recommendedPrice).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    </div>
                    {/* Fecha y hora de aprobación */}
                    {treatment.approvedDate && (
                      <div className="mt-2 text-xs text-green-800 dark:text-green-300">
                        Fecha y hora de aprobación: {approvedDate}
                      </div>
                    )}
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
                                  value={row.conventionalPrice === 0 ? '' : row.conventionalPrice}
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
                                  value={row.recommendedPrice === 0 ? '' : row.recommendedPrice}
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
            {(!isApproved && isSaving) && (
              <Button className="w-full sm:w-auto" disabled>Cargando...</Button>
            )}
            {(!isApproved && isApproving) && (
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" disabled>Cargando...</Button>
            )}
            {(!isApproved && isDownloading) && (
              <Button className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700" disabled>Descargando...</Button>
            )}
            {(!isApproved && !isSaving && !isApproving && !isDownloading) && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cerrar</Button>
                <Button onClick={handleDownloadPDF} className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">Descargar PDF</Button>
                <Button onClick={handleSaveChanges} className="w-full sm:w-auto">Guardar Cambios</Button>
                <Button onClick={handleApproveRequest} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">Aprobar Tratamiento</Button>
              </>
            )}
            {isApproved && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cerrar</Button>
                {/* Si quieres, puedes dejar el botón de PDF activo en modo solo lectura */}
                <Button onClick={handleDownloadPDF} className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">Descargar PDF</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[320px] w-[95vw] max-h-[95vh] overflow-y-auto !bg-white !dark:bg-zinc-900 !bg-opacity-100 !backdrop-blur-0">
          <DialogHeader>
            <DialogTitle className="section-title">Captura de Huella Digital</DialogTitle>
            {tutors.length > 0 && !fingerError && (
              <DialogDescription>
                <span className="text-xs text-muted-foreground">
                  Seleccione el tipo de tratamiento, tutor y coloque el dedo indicado en el lector, luego haga clic en 'Iniciar captura'.
                </span>
              </DialogDescription>
            )}
            {tutors.length > 0 && approvalStep === 'idle' && !fingerError && (
              <div className="w-full mt-2">
                <label className="block text-xs mb-1">Tipo de tratamiento a aprobar</label>
                <select
                  className="w-full border rounded p-1 text-sm"
                  value={approvedTreatmentType}
                  onChange={e => setApprovedTreatmentType(e.target.value as 'convencional'|'recomendado')}
                  disabled={approvalStep !== 'idle'}
                >
                  <option value="convencional">Tratamiento convencional</option>
                  <option value="recomendado">Tratamiento recomendado</option>
                </select>
              </div>
            )}
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="w-full">
              <label className="block text-xs mb-1">Tutor</label>
              {tutorsLoading ? (
                <div className="text-sm text-muted-foreground">Cargando tutores...</div>
              ) : tutors.length === 0 ? (
                <>
                  <div className="text-sm text-red-600 font-semibold">No hay tutores registrados. Registre por lo menos a un tutor para este paciente</div>
                  <div className="flex flex-col gap-1 mt-1 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded px-2 py-2">
                    <div className="flex justify-center w-full">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' /></svg>
                    </div>
                    <span>Oprima Cancelar captura, registre un tutor, vuelva a seleccionar el tratamiento deseado y oprima "Aprobar tratamiento" nuevamente</span>
                  </div>
                </>
              ) : tutors.length === 1 ? (
                <div className="font-medium py-2 text-sm">{tutors[0].nombre}</div>
              ) : (
                <select
                  className="w-full border rounded p-1 text-sm"
                  value={selectedTutorId || ''}
                  onChange={e => setSelectedTutorId(Number(e.target.value))}
                  disabled={approvalStep !== 'idle' || tutors.length === 0}
                >
                  <option value="">Seleccione un tutor</option>
                  {tutors.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="w-full">
              <label className="block text-sm mb-1">Dedo</label>
              {tutors.length === 0 ? (
                <div className="text-sm text-muted-foreground">Seleccione un tutor</div>
              ) : !selectedTutorId ? (
                <div className="text-sm text-muted-foreground">Seleccione un tutor</div>
              ) : fingerLoading ? (
                <div className="text-sm text-muted-foreground">Cargando dedo...</div>
              ) : fingerError ? (
                <>
                  <div className="text-sm text-red-600">
                    {tutors.length > 1
                      ? 'No se encontró una huella registrada para este tutor. Cambie de tutor o solicite el registro de huella antes de aprobar.'
                      : 'No se encontró una huella registrada para este tutor. Solicite el registro de huella antes de aprobar.'}
                  </div>
                  <div className="flex flex-col gap-1 mt-1 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded px-2 py-2">
                    <div className="flex justify-center w-full">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 mb-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' /></svg>
                    </div>
                    <span>Oprima Cancelar captura, registre la huella del tutor, vuelva a seleccionar el tratamiento deseado y oprima "Aprobar tratamiento" nuevamente</span>
                  </div>
                </>
              ) : fingerName ? (
                <div className="w-full text-base font-medium text-center py-2">{formatFingerName(fingerName)}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Seleccione un tutor para ver el dedo registrado</div>
              )}
            </div>
            <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-background">
              <Fingerprint className={`h-8 w-8 ${getFingerprintColor(pollingState || approvalStep)}`} />
            </div>
            {approvalStep === 'creating' && (
              <div className="w-full text-center text-sm text-muted-foreground">Creando tarea huella...</div>
            )}
            {approvalStep === 'waiting' && (
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-2 mb-2">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200 text-sm">Vaya al programa de escritorio, de clic en "Aprobar tratamiento" y siga las instrucciones.</span>
                </div>
                <div className="w-full text-center text-sm text-muted-foreground">Esperando respuesta...</div>
              </div>
            )}
            {approvalStep === 'success' && (
              <>
                <div className="w-full text-center text-green-600 dark:text-green-400 font-semibold">¡Huella verificada y tratamiento {approvedTreatmentType === 'convencional' ? 'convencional' : 'recomendado'} aprobado!</div>
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // Limpiar estado del modal de huella
                    setApprovalStep('idle');
                    setPollingState('');
                    setPollingResult(null);
                    setApprovalError(null);
                    setSelectedTutorId(null);
                    setFingerName("");
                    setFingerError("");
                    setTaskId(null);
                    setIsPolling(false);
                    setShowApprovalDialog(false);
                    // Cerrar modal de detalles
                    onOpenChange(false);
                    // Recargar historial del paciente
                    setTimeout(() => {
                      onUpdate();
                    }, 200);
                  }}
                >
                  Salir
                </Button>
              </>
            )}
            {approvalStep === 'error' && (
              <>
                <div className="w-full text-center text-red-600 dark:text-red-400 font-semibold">{approvalError}</div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleStartApproval}
                    disabled={!selectedTutorId || !fingerName}
                  >
                    Reintentar
                  </Button>
                  {approvalError === 'Tiempo de espera agotado para la verificación de huella' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowApprovalDialog(false)}
                      className="w-full text-base h-10"
                    >
                      Cancelar captura
                    </Button>
                  )}
                  {approvalError === 'La huella no coincide.' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowApprovalDialog(false)}
                      className="w-full text-base h-10"
                    >
                      Cancelar captura
                    </Button>
                  )}
                </div>
              </>
            )}
            {(approvalStep === 'idle' || approvalStep === 'creating') && (
              <div className="flex flex-col gap-2 w-full mt-2">
                <Button
                  onClick={handleStartApproval}
                  disabled={
                    approvalStep !== 'idle' ||
                    !selectedTutorId ||
                    !fingerName ||
                    fingerLoading ||
                    !!fingerError
                  }
                  className="w-full text-base h-10"
                >
                  {approvalStep === 'creating' ? 'Creando tarea huella...' : 'Iniciar captura'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalDialog(false)}
                  className="w-full text-base h-10"
                  disabled={approvalStep === 'creating'}
                >
                  Cancelar captura
                </Button>
              </div>
            )}
          </div>
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
