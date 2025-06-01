import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TutorList from './TutorList';
import TutorForm from './TutorForm';
import FingerprintModal from './FingerprintModal';
import TutorEditModal from './TutorEditModal';
import TutorDeleteConfirm from './TutorDeleteConfirm';

interface TutorModalProps {
  open: boolean;
  onClose: () => void;
  paciente: any;
}

const TutorModal: React.FC<TutorModalProps> = ({ open, onClose, paciente }) => {
  const [showForm, setShowForm] = useState(false);
  const [tutores, setTutores] = useState<any[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [newTutorId, setNewTutorId] = useState<number | null>(null);
  const [loadingTutores, setLoadingTutores] = useState(false);
  const [tutoresEnActualizacion, setTutoresEnActualizacion] = useState<number[]>([]);
  const [editTutor, setEditTutor] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTutor, setDeleteTutor] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (open && paciente?.id) {
      setLoadingTutores(true);
      fetch(`/api/tutores?paciente_id=${paciente.id}`)
        .then(async res => {
          const text = await res.text();
          if (!text) return { tutores: [] };
          try {
            return JSON.parse(text);
          } catch {
            return { tutores: [] };
          }
        })
        .then(data => setTutores(data.tutores || []))
        .finally(() => setLoadingTutores(false));
    }
  }, [open, paciente]);

  const handleTutorAdded = (tutorId: number) => {
    setShowForm(false);
    setNewTutorId(tutorId);
    setShowFingerprintModal(true);
    // Refrescar lista de tutores después de registrar huella
    fetch(`/api/tutores?paciente_id=${paciente.id}`)
      .then(res => res.json())
      .then(data => setTutores(data.tutores || []));
  };

  const handleRegistrarHuella = (tutorId: number) => {
    setTutoresEnActualizacion((prev) => [...prev, tutorId]);
    setSelectedTutorId(tutorId);
    setShowFingerprintModal(true);
    setNewTutorId(null); // Asegura que no se use el flujo de nuevo tutor
  };

  const handleCloseFingerprintModal = () => {
    setSelectedTutorId(null);
    // Refrescar lista de tutores tras registrar huella
    fetch(`/api/tutores?paciente_id=${paciente.id}`)
      .then(res => res.json())
      .then(data => {
        setTutores(data.tutores || []);
        setTutoresEnActualizacion([]); // Limpiar aquí para feedback inmediato
      })
      .catch(() => setTutoresEnActualizacion([])); // Asegura limpieza en error
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tutores de {paciente?.name || paciente?.nombre}</DialogTitle>
        </DialogHeader>
        <TutorList
          tutores={tutores}
          loading={loadingTutores}
          onRegistrarHuella={handleRegistrarHuella}
          tutoresEnActualizacion={tutoresEnActualizacion}
          onEditarTutor={(tutor) => {
            setEditTutor(tutor);
            setShowEditModal(true);
          }}
          onEliminarTutor={(tutorId) => {
            const t = tutores.find(t => t.id === tutorId);
            setDeleteTutor(t);
            setShowDeleteModal(true);
          }}
        />
        <div className="flex justify-end mt-4">
          <Button onClick={() => setShowForm(true)}>Agregar nuevo tutor</Button>
        </div>
        {showForm && (
          <TutorForm
            paciente={paciente}
            onSuccess={() => setShowForm(false)}
            onTutorCreated={handleTutorAdded}
            onCancel={() => setShowForm(false)}
            tutoresCount={tutores.length}
          />
        )}
        {/* Modal edición */}
        {showEditModal && editTutor && (
          <TutorEditModal
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
            tutor={editTutor}
            paciente={paciente}
            onUpdated={() => {
              setShowEditModal(false);
              setEditTutor(null);
              fetch(`/api/tutores?paciente_id=${paciente.id}`)
                .then(res => res.json())
                .then(data => setTutores(data.tutores || []));
            }}
          />
        )}
        {/* Modal eliminar */}
        {showDeleteModal && deleteTutor && (
          <TutorDeleteConfirm
            open={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            tutorName={deleteTutor.nombre}
            onConfirm={async () => {
              await fetch('/api/tutores', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deleteTutor.id, paciente_id: paciente.id })
              });
              setShowDeleteModal(false);
              setDeleteTutor(null);
              fetch(`/api/tutores?paciente_id=${paciente.id}`)
                .then(res => res.json())
                .then(data => setTutores(data.tutores || []));
            }}
          />
        )}
        {/* Mostrar FingerprintModal para registro de huella de tutor existente */}
        {showFingerprintModal && selectedTutorId && (
          <FingerprintModal
            open={showFingerprintModal}
            onClose={() => {
              setShowFingerprintModal(false);
              setSelectedTutorId(null);
              handleCloseFingerprintModal();
            }}
            tutorId={selectedTutorId}
            onSuccess={() => {
              setShowFingerprintModal(false);
              setSelectedTutorId(null);
              handleCloseFingerprintModal();
            }}
            onExit={() => {
              setShowFingerprintModal(false);
              setSelectedTutorId(null);
              handleCloseFingerprintModal();
            }}
            fromPendingList={true} // Solo en flujo desde lista de tutores
          />
        )}
        {/* Modal para nuevo tutor ya estaba implementado */}
        {showFingerprintModal && newTutorId && (
          <FingerprintModal
            open={showFingerprintModal}
            onClose={() => setShowFingerprintModal(false)}
            tutorId={newTutorId}
            onSuccess={() => setShowFingerprintModal(false)}
            onExit={() => {
              setShowFingerprintModal(false);
              setNewTutorId(null);
              // Refresca la lista de tutores
              fetch(`/api/tutores?paciente_id=${paciente.id}`)
                .then(res => res.json())
                .then(data => setTutores(data.tutores || []));
            }}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TutorModal;
