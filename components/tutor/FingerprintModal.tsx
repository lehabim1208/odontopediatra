import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Fingerprint, Info, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';

interface FingerprintModalProps {
  open: boolean;
  onClose: () => void;
  tutorId: number;
  onSuccess: () => void;
  onExit?: () => void; // Nueva prop opcional para cerrar el modal de registro de tutor y refrescar lista
  fromPendingList?: boolean; // Nuevo: indica si el flujo es desde la lista de tutores
}

const FingerprintModal: React.FC<FingerprintModalProps> = ({ open, onClose, tutorId, onSuccess, onExit, fromPendingList }) => {
  const [dedo, setDedo] = useState('indice_derecho');
  const [status, setStatus] = useState('');
  const [taskId, setTaskId] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [error, setError] = useState('');
  const [showExit, setShowExit] = useState(false);
  const [hasPendingTask, setHasPendingTask] = useState<boolean>(false);
  const [checkingPending, setCheckingPending] = useState<boolean>(false);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      setTaskId(null);
      setWaiting(false);
      setStatus('');
      setCanClose(false);
      setIsCapturing(false);
      setIsCaptured(false);
      setError('');
      setDedo('indice_derecho');
      setShowExit(false);
      setHasPendingTask(false);
      setPendingTaskId(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && tutorId) {
      setCheckingPending(true);
      fetch(`/api/huellas/pending?tutor_id=${tutorId}`)
        .then(res => res.json())
        .then(data => {
          setHasPendingTask(!!data.hasPending);
          setPendingTaskId(data.taskId || null);
        })
        .catch(() => {
          setHasPendingTask(false);
          setPendingTaskId(null);
        })
        .finally(() => setCheckingPending(false));
    } else {
      setHasPendingTask(false);
      setPendingTaskId(null);
    }
  }, [open, tutorId]);

  // Polling para saber si la huella ya fue capturada
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    if (waiting && taskId) {
      setTimeoutReached(false);
      timeout = setTimeout(async () => {
        setTimeoutReached(true);
        setWaiting(false);
        setStatus('');
        // Llama PATCH para marcar la tarea como fallida por timeout de registro
        await fetch('/api/huellas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: taskId, tipo: 'registro' }),
        });
      }, 30000); // 30 segundos
      setTimeoutId(timeout);
      interval = setInterval(() => {
        fetch(`/api/huellas?task_id=${taskId}`)
          .then(res => res.json())
          .then(data => {
            // Si la tarea está completada, marcar éxito sin importar el resultado
            if ((data.success && data.completed) || data.estado === 'completado') {
              setStatus('Huella capturada correctamente');
              setCanClose(true);
              setWaiting(false);
              setIsCaptured(true);
              setShowExit(true);
              setTimeoutReached(false);
              if (timeout) clearTimeout(timeout);
            } else if (data.resultado && typeof data.resultado === 'string' && (data.resultado.toLowerCase().includes('tiempo de espera') || data.resultado.toLowerCase().includes('error') || data.resultado.toLowerCase().includes('fallido'))) {
              setStatus('');
              setError(data.resultado);
              setCanClose(true);
              setWaiting(false);
              setIsCaptured(false);
              setShowExit(false);
              setTimeoutReached(true);
              if (timeout) clearTimeout(timeout);
            }
          });
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [waiting, taskId, onSuccess, onClose]);

  // Polling para tarea pendiente de huella (cuando ya existe una tarea pendiente para el tutor)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (open && tutorId && !waiting && !isCaptured) {
      interval = setInterval(() => {
        fetch(`/api/huellas/pending-task?tutor_id=${tutorId}`, { cache: 'no-store' })
          .then(res => res.json())
          .then(data => {
            setHasPendingTask(!!data.hasPending);
            setPendingTaskId(data.taskId || null);
            if (data.isCompleted) {
              setStatus('Huella capturada correctamente');
              setCanClose(true);
              setWaiting(false);
              setIsCaptured(true);
              setShowExit(true);
            }
          });
      }, 5000); // cada 5 segundos
    }
    return () => interval && clearInterval(interval);
  }, [open, tutorId, waiting, isCaptured]);

  const handleCancel = () => {
    setCanClose(true);
    onClose();
  };

  const startCapture = async () => {
    setIsCapturing(true);
    setError('');
    setStatus('');
    try {
      const res = await fetch('/api/huellas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutor_id: tutorId, dedo, template: null }),
      });
      const data = await res.json();
      if (data.success && data.task_id) {
        setTaskId(data.task_id);
        setStatus('Esperando captura de huella en el lector...');
        setWaiting(true);
      } else {
        setError('Error al crear tarea de huella.');
      }
    } catch {
      setError('Error al crear tarea de huella.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { if (canClose) onClose(); }}>
      <DialogContent className="max-w-xs bg-background border border-border rounded-xl p-0 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-center py-4">Captura de Huella Digital</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 pt-2">
          <p className={`text-xs mb-4 text-center ${isCaptured ? 'text-green-700 font-semibold' : 'text-muted-foreground'}`}>
            {isCaptured ? 'Éxito'
              : hasPendingTask
                ? (<>
                    <br />
                    {pendingTaskId && (
                      <span className="block mt-1">Tarea encontrada: #{pendingTaskId}</span>
                    )}
                  </>)
                : "Seleccione el dedo que desea capturar y haga clic en 'Iniciar captura'."}
          </p>
          {/* Ícono de huella, margen reducido si hay tarea pendiente */}
          <div className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center mb-4 bg-background${hasPendingTask ? ' mt-0 mb-2' : ''}`} style={hasPendingTask ? { marginTop: 0, marginBottom: 8 } : {}}>
            <Fingerprint className={`h-12 w-12 ${isCapturing ? 'animate-pulse text-primary' : isCaptured ? 'text-green-500' : 'text-muted-foreground'}`} />
          </div>
          {/* Ocultar el dropdown cuando la huella ya fue capturada o hay tarea pendiente */}
          {!isCaptured && !hasPendingTask && (
            <select
              id="dedo"
              value={dedo}
              onChange={e => setDedo(e.target.value)}
              className="w-full border rounded p-2 mb-4 bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!!taskId || waiting}
            >
              <option value="indice_derecho">Índice derecho</option>
              <option value="indice_izquierdo">Índice izquierdo</option>
            </select>
          )}
          {status === 'Esperando captura de huella en el lector...' && (
            <div
              className="flex items-center gap-2 rounded px-2 py-1 mb-4 text-sm"
              style={{
                backgroundColor: 'var(--esperando-bg, #e5e7eb)',
                color: '#1e40af',
              }}
            >
              <span className="flex items-center justify-center h-5"><Info className="w-4 h-4" style={{ color: '#1e40af' }} /></span>
              <span>Vaya al programa de escritorio, de clic en "Iniciar" y siga las instrucciones.</span>
            </div>
          )}
          {status === 'Huella capturada correctamente' && (
            <div
              className="flex items-center gap-2 rounded px-2 py-1 mb-4 text-sm"
              style={{
                backgroundColor: '#e5e7eb', // gris claro
                color: '#22c55e', // verde
              }}
            >
              <Fingerprint className="w-4 h-4" style={{ color: '#22c55e' }} />
              <span>Huella capturada correctamente</span>
            </div>
          )}
          {status && status !== 'Esperando captura de huella en el lector...' && status !== 'Huella capturada correctamente' && (
            <div className="text-center text-sm mb-4 min-h-[24px]">{status}</div>
          )}
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {/* Spinner y mensaje de conectando mientras checkingPending */}
          {checkingPending && (
            <div className="flex flex-col items-center justify-center w-full mb-2">
              <LoadingSpinner size="sm" />
              <span className="text-xs text-muted-foreground mt-1">Conectando...</span>
            </div>
          )}
          {/* Mensaje de tarea pendiente con fondo amarillo claro, icono de advertencia arriba y texto actualizado */}
          {!showExit && !checkingPending && hasPendingTask && fromPendingList && (
            <div
              className="w-full text-xs rounded px-2 py-2 mb-2 text-center flex flex-col items-center justify-center"
              style={{
                backgroundColor: '#FEF3C7', // amarillo claro
                color: '#92400E', // marrón oscuro para advertencia
              }}
            >
              <AlertTriangle className="w-8 h-8 mb-2 text-yellow-600 mx-auto" />
              <div className="text-sm font-medium">
                Verifique que se haya dado en el botón "Iniciar" en el programa de escritorio.<br />
                 {pendingTaskId && (<span className="font-bold">Tarea encontrada: #{pendingTaskId}</span>)}
              </div>
              <div className="mt-2">
                Ya existe una tarea pendiente de captura de huella para este tutor. Por favor, sigue el proceso en el programa de escritorio.
              </div>
            </div>
          )}
          {showExit && (
            <Button
              onClick={() => {
                if (onExit) onExit();
                onSuccess();
                onClose();
              }}
              className="w-full text-sm py-1 h-10 bg-green-600 hover:bg-green-700 text-white font-semibold rounded mt-2"
            >
              Salir
            </Button>
          )}
          {/* Botones principales: Iniciar y Cancelar captura (solo si no hay timeout ni showExit ni checkingPending ni tarea pendiente) */}
          {!showExit && !checkingPending && !timeoutReached && !hasPendingTask && (
            <>
              <Button
                onClick={startCapture}
                disabled={isCapturing || !!taskId || waiting || checkingPending || status === 'Esperando captura de huella en el lector...' || timeoutReached}
                className="w-full text-sm py-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded flex items-center justify-center gap-2 mt-2"
              >
                {status === 'Esperando captura de huella en el lector...'
                  ? (<><span>Esperando captura</span> <LoadingSpinner size="sm" /></>)
                  : isCapturing
                  ? 'Creando tarea...'
                  : 'Iniciar captura'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={waiting && !canClose}
                className="w-full text-sm py-1 h-8 mt-6 border border-gray-300 dark:border-gray-600 text-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancelar captura
              </Button>
            </>
          )}
          {/* Botones y mensajes de timeout */}
          {timeoutReached && !isCaptured ? (
            <div className="w-full flex flex-col items-center gap-2 mt-2">
              <div className="text-red-600 text-sm font-semibold text-center">Tiempo de espera agotado para el registro de huella</div>
              <Button
                onClick={() => {
                  setTimeoutReached(false);
                  setTaskId(null);
                  setStatus('');
                  setError('');
                  setWaiting(false);
                  startCapture();
                }}
                className="w-full text-sm py-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
              >
                Reintentar
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full text-sm py-1 h-8 border border-gray-300 dark:border-gray-600 text-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancelar captura
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FingerprintModal;
