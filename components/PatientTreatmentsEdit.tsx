import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TreatmentTable } from "@/components/treatment-table";
import { FingerprintCapture } from "@/components/fingerprint-capture";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Fingerprint } from "lucide-react";
import { Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Tipos para las props
export interface Patient {
  id: number;
  name: string;
  age: number;
  guardian: string;
  lastVisit: string;
  nextVisit: string;
  phone?: string;
  additionalPhones?: string[];
  email?: string;
  additionalInfo?: {
    weight?: string;
    height?: string;
    allergies?: string;
    medications?: string;
    bloodType?: string;
    notes?: string;
  };
  medicalInfo?: any;
}

export interface TreatmentRow {
  id: string;
  toothNumber: string;
  conventionalTreatment: string;
  recommendedTreatment: string;
  conventionalPrice: number;
  recommendedPrice: number;
}

export interface PatientTreatmentsSectionProps {
  showTreatmentDialog: boolean;
  setShowTreatmentDialog: (open: boolean) => void;
  showApprovalDialog: boolean;
  setShowApprovalDialog: (open: boolean) => void;
  selectedPatient: Patient | null;
  currentTreatmentRows: TreatmentRow[];
  setCurrentTreatmentRows: (rows: TreatmentRow[]) => void;
  conventionalTotal: number;
  setConventionalTotal: (total: number) => void;
  recommendedTotal: number;
  setRecommendedTotal: (total: number) => void;
  selectedTreatmentType: "conventional" | "recommended";
  setSelectedTreatmentType: (type: "conventional" | "recommended") => void;
  fingerprintData: string | null;
  setFingerprintData: (data: string | null) => void;
  handleTreatmentUpdateRows: (rows: TreatmentRow[]) => void;
  handleSaveTreatment: (approved?: boolean) => void;
  handleApprovalRequest: () => void;
  isSavingTreatment: boolean;
  setIsSavingTreatment: (saving: boolean) => void;
  currentTreatmentId: number;
}

// Recibe todas las props necesarias para funcionar igual que en page.tsx
export default function PatientTreatmentsSection({
  showTreatmentDialog,
  setShowTreatmentDialog,
  showApprovalDialog,
  setShowApprovalDialog,
  selectedPatient,
  currentTreatmentRows,
  setCurrentTreatmentRows,
  conventionalTotal,
  setConventionalTotal,
  recommendedTotal,
  setRecommendedTotal,
  selectedTreatmentType,
  setSelectedTreatmentType,
  fingerprintData,
  setFingerprintData,
  handleTreatmentUpdateRows,
  handleSaveTreatment,
  handleApprovalRequest,
  isSavingTreatment,
  setIsSavingTreatment,
  currentTreatmentId,
}: PatientTreatmentsSectionProps) {
  // --- Estados para aprobación por huella ---
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [selectedFinger, setSelectedFinger] = useState<string>("pulgar_derecho");
  const [isPolling, setIsPolling] = useState(false);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [fingerName, setFingerName] = useState<string>("");
  const [fingerLoading, setFingerLoading] = useState(false);
  const [showApprovalUI, setShowApprovalUI] = useState(true);
  const treatmentTableRef = useRef<any>(null);
  const [fingerError, setFingerError] = useState<string>("");
  const [approvalStep, setApprovalStep] = useState<'idle' | 'creating' | 'waiting' | 'success' | 'error'>('idle');
  const [pollingState, setPollingState] = useState<string>('');
  const [pollingResult, setPollingResult] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  // Nuevo estado para el tipo de tratamiento a aprobar
  const [approvedTreatmentType, setApprovedTreatmentType] = useState<'convencional'|'recomendado'>('convencional');
  const { toast } = useToast();

  // Formatea el nombre del dedo con acentos y mayúsculas correctas
  function formatFingerName(finger: string) {
    switch (finger) {
      case "indice_derecho": return "Índice derecho";
      case "indice_izquierdo": return "Índice izquierdo";
      case "pulgar_derecho": return "Pulgar derecho";
      case "pulgar_izquierdo": return "Pulgar izquierdo";
      default:
        // Fallback: reemplaza guion bajo por espacio y capitaliza
        return finger.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  // Animación de color para la huella
  function getFingerprintColor(state: string) {
    if (state === "completado") return "text-green-500";
    if (state === "fallido" || state === "error") return "text-red-500";
    return "animate-fingerprint-pulse text-blue-500";
  }

  // Obtener tutores del paciente
  const fetchTutors = async () => {
    if (!selectedPatient?.id) return;
    setTutorsLoading(true);
    try {
      const res = await fetch(`/api/tutores?paciente_id=${selectedPatient.id}`);
      const data = await res.json();
      setTutors(data.tutores || []);
    } catch (e) {
      console.error(e);
    } finally {
      setTutorsLoading(false);
    }
  };

  // Efecto para obtener tutores al abrir el modal de aprobación
  useEffect(() => {
    if (showApprovalDialog) {
      fetchTutors();
    }
  }, [showApprovalDialog]);

  // Seleccionar automáticamente el tutor si solo hay uno
  useEffect(() => {
    if (tutors.length === 1) {
      setSelectedTutorId(tutors[0].id);
    }
  }, [tutors]);

  // Obtener el dedo registrado al seleccionar un tutor
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

  // Nuevo: cargar detalles del tratamiento al abrir el modal
  useEffect(() => {
    if (showTreatmentDialog && currentTreatmentId) {
      // Cargar detalles solo si es edición
      fetch(`/api/detalle_tratamientos?id_tratamiento=${currentTreatmentId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.detalles)) {
            // Mapear a TreatmentRow
            const rows = data.detalles.map((d: any) => ({
              id: d.id.toString(),
              toothNumber: d.organo_dentario,
              conventionalTreatment: d.tratamiento_convencional,
              recommendedTreatment: d.tratamiento_recomendado,
              conventionalPrice: Number(d.precio_convencional),
              recommendedPrice: Number(d.precio_recomendado),
            }));
            setCurrentTreatmentRows(rows);
            setConventionalTotal(rows.reduce((sum: number, r: any) => sum + (r.conventionalPrice || 0), 0));
            setRecommendedTotal(rows.reduce((sum: number, r: any) => sum + (r.recommendedPrice || 0), 0));
          }
        })
        .catch(() => {
          toast({ title: "Error", description: "No se pudieron cargar los detalles del tratamiento", variant: "destructive" });
        });
    }
  }, [showTreatmentDialog, currentTreatmentId]);

  // Al iniciar la captura
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
          id_tratamiento: currentTreatmentId,
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

  // Polling para verificar tarea de huella
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
          await fetch(`/api/tratamientos/${currentTreatmentId}/aprobar`, {
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
          // Marcar la tarea como fallida por timeout
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

  // Limpiar estados al cerrar el modal
  useEffect(() => {
    if (!showApprovalDialog) {
      setSelectedTutorId(null);
      setSelectedFinger("pulgar_derecho");
      setIsPolling(false);
      setTaskId(null);
      setPollError(null);
      setApprovalStep('idle');
      setPollingState('');
      setPollingResult(null);
      setApprovalError(null);
    }
  }, [showApprovalDialog]);

  // Al aprobar tratamiento, ocultar botones, limpiar tabla y cerrar modal
  const handleApproveTreatment = async () => {
    setShowApprovalUI(false);
    await handleApprovalRequest();
    setCurrentTreatmentRows([]); // Limpiar tabla
    setTimeout(() => {
      setShowTreatmentDialog(false);
      setShowApprovalUI(true);
    }, 500); // Espera breve para UX
  };

  // Guardar cambios (actualizar tratamiento y detalles)
  const handleUpdateTreatment = async () => {
    if (!selectedPatient || !currentTreatmentId) return;
    setIsSavingTreatment(true);
    const detalles = currentTreatmentRows.map(row => ({
      id: row.id,
      organo_dentario: row.toothNumber,
      tratamiento_convencional: row.conventionalTreatment,
      tratamiento_recomendado: row.recommendedTreatment,
      precio_convencional: row.conventionalPrice,
      precio_recomendado: row.recommendedPrice,
    }));
    const body = {
      id_tratamiento: currentTreatmentId,
      id_paciente: selectedPatient.id,
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
      toast({ title: "Éxito", description: "Tratamiento actualizado correctamente", variant: "success" });
      setShowTreatmentDialog(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingTreatment(false);
    }
  };

  // Valida si hay al menos una fila de tratamiento completa
  function hasCompleteTreatmentRow() {
    return currentTreatmentRows.some(row =>
      row.toothNumber &&
      row.conventionalTreatment &&
      row.recommendedTreatment &&
      (row.conventionalPrice !== undefined && row.conventionalPrice !== null) &&
      (row.recommendedPrice !== undefined && row.recommendedPrice !== null)
    );
  }

  return (
    <>
      {/* Treatment Dialog */}
      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="section-title">Editar Tratamiento</DialogTitle>
            <DialogDescription>
              {selectedPatient && `Editar plan de tratamiento para ${selectedPatient.name}`}
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
                <TreatmentTable initialRows={currentTreatmentRows} onUpdate={handleTreatmentUpdateRows} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isSavingTreatment ? (
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" disabled>
                Cargando...
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowTreatmentDialog(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateTreatment}
                  className="w-full sm:w-auto"
                  disabled={isSavingTreatment || !hasCompleteTreatmentRow()}
                  title={!hasCompleteTreatmentRow() ? 'Agregue al menos una fila completa de tratamiento para guardar.' : ''}
                >
                  Guardar Tratamiento
                </Button>
                <Button
                  onClick={async () => { await handleUpdateTreatment(); await handleApproveTreatment(); }}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  disabled={isSavingTreatment || !hasCompleteTreatmentRow()}
                  title={!hasCompleteTreatmentRow() ? 'Agregue al menos una fila completa de tratamiento para aprobar.' : ''}
                >
                  Aprobar Tratamiento
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={open => open ? setShowApprovalDialog(true) : null}>
        <DialogContent
          className="sm:max-w-[320px] w-[95vw] max-h-[95vh] overflow-y-auto !bg-white !dark:bg-zinc-900 !bg-opacity-100 !backdrop-blur-0"
        >
          <DialogHeader>
            <DialogTitle className="section-title">Captura de Huella Digital</DialogTitle>
            {/* Instrucciones siempre visibles si hay tutores */}
            {tutors.length > 0 && !fingerError && (
              <DialogDescription>
                <span className="text-xs text-muted-foreground">
                  Seleccione el tipo de tratamiento, tutor y coloque el dedo indicado en el lector, luego haga clic en 'Iniciar captura'.
                </span>
              </DialogDescription>
            )}
            {/* Dropdown tipo de tratamiento solo antes de iniciar captura y si no hay error de huella */}
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
            {/* Dropdown de tutor (siempre visible) */}
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
                    <span>El tratamiento ya ha sido guardado, oprima Cancelar captura, registre un tutor y despues vaya al Historial del paciente para seleccionar el tratamiento creado y oprima Aprobar tratamiento nuevamente</span>
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
            {/* Dedo a usar (siempre visible) */}
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
                    <span>El tratamiento ya ha sido guardado, oprima Cancelar captura, registre la huella del tutor y despues vaya al Historial del paciente para seleccionar el tratamiento creado y oprima Aprobar tratamiento nuevamente</span>
                  </div>
                </>
              ) : fingerName ? (
                <div className="w-full text-base font-medium text-center py-2">{formatFingerName(fingerName)}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Seleccione un tutor para ver el dedo registrado</div>
              )}
            </div>
            {/* Icono de huella con animación (más pequeño) */}
            <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-background">
              <Fingerprint className={`h-8 w-8 ${getFingerprintColor(pollingState || approvalStep)}`} />
            </div>
            {/* Mensaje de estado y recuadro info */}
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
                  onClick={() => setShowApprovalDialog(false)}
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
                  {/* Mostrar Cancelar solo si el error es por timeout */}
                  {approvalError === 'Tiempo de espera agotado para la verificación de huella' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowApprovalDialog(false)}
                      className="w-full text-base h-10"
                    >
                      Cancelar captura
                    </Button>
                  )}
                  {/* Mostrar Cancelar solo si el error es por no coincidencia */}
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

      {/* Custom CSS para animación de color
      Agrega esto a tu archivo globals.css:
      .animate-fingerprint-pulse {
        animation: fingerprint-pulse 1.2s infinite;
      }
      @keyframes fingerprint-pulse {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(0.6); }
      }
      */}
    </>
  );
}
