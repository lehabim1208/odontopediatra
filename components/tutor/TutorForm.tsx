import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import FingerprintModal from './FingerprintModal';

interface TutorFormProps {
  paciente?: any;
  onSuccess: () => void;
  onTutorCreated?: (tutorId: number) => void;
  onCancel: () => void;
  tutoresCount?: number;
}

const RELACIONES = [
  'Papá', 'Mamá', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Hermana', 'Hermano',
  'Prima', 'Primo', 'Bisabuela', 'Bisabuelo', 'Cuidador', 'Otro'
];

const TutorForm: React.FC<TutorFormProps> = ({ paciente: initialPaciente, onSuccess, onTutorCreated, onCancel, tutoresCount = 0 }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [relacion, setRelacion] = useState('');
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [newTutorId, setNewTutorId] = useState<number | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(initialPaciente || null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialPaciente && tutoresCount === 0) {
      setSelectedPaciente(initialPaciente);
      setShowAutoFill(true);
    } else {
      setShowAutoFill(false);
    }
  }, [initialPaciente, tutoresCount]);

  // Buscar pacientes en tiempo real al escribir
  useEffect(() => {
    if (search.length > 2) {
      setSearching(true);
      fetch(`/api/pacientes?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => setPacientes(data.patients || []))
        .catch(() => setPacientes([]))
        .finally(() => setSearching(false));
    } else {
      setPacientes([]);
    }
  }, [search]);

  // Cuando selecciona paciente, preguntar si autollenar
  const handleSelectPaciente = (p: any) => {
    setSelectedPaciente(p);
    setShowAutoFill(true);
  };

  const handleAutoFill = (accept: boolean) => {
    setShowAutoFill(false);
    if (accept && selectedPaciente) {
      setNombre(selectedPaciente.guardian || '');
      setTelefono(selectedPaciente.phone || '');
      setCorreo(selectedPaciente.email || '');
    } else {
      setNombre('');
      setTelefono('');
      setCorreo('');
    }
  };

  const validateFields = () => {
    const errors: { [key: string]: string } = {};
    if (!nombre || nombre.trim().length < 3) {
      errors.nombre = 'El nombre es obligatorio y debe tener al menos 3 caracteres';
    }
    if (!telefono || telefono.trim().length !== 10 || !/^\d{10}$/.test(telefono)) {
      errors.telefono = 'El teléfono es obligatorio, debe tener exactamente 10 dígitos numéricos';
    }
    if (!correo || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(correo)) {
      errors.correo = 'El correo es obligatorio y debe tener un formato válido (ejemplo@dominio.com)';
    }
    if (!relacion) {
      errors.relacion = 'Selecciona la relación con el paciente';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (!selectedPaciente) {
      setError('Selecciona un paciente primero');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tutores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          telefono,
          correo,
          relacion,
          paciente_id: selectedPaciente.id,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al registrar tutor');
      setNewTutorId(data.tutor_id);
      setFormDisabled(true);
      setNombre('');
      setTelefono('');
      setCorreo('');
      setShowFingerprintModal(true);
      onCancel();
      if (onTutorCreated) onTutorCreated(data.tutor_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open onOpenChange={onCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Tutor</DialogTitle>
          </DialogHeader>
          {!selectedPaciente && (
            <div className="space-y-2 mb-4">
              <label className="block font-medium">Buscar paciente</label>
              <div className="flex gap-2">
                <input
                  className="border rounded px-2 py-1 flex-1"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nombre, tutor, teléfono..."
                />
              </div>
              {searching && <div className="text-xs text-muted-foreground">Buscando...</div>}
              {pacientes.length > 0 && (
                <div className="border rounded mt-2 max-h-40 overflow-y-auto">
                  {pacientes.map(p => (
                    <div
                      key={p.id}
                      className="px-2 py-1 hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectPaciente(p)}
                    >
                      {p.nombre || p.name} ({p.edad || p.age} años)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selectedPaciente && showAutoFill && tutoresCount === 0 ? (
            <div className="space-y-4">
              <div>¿Desea autollenar los datos del tutor con la información registrada del paciente?</div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => handleAutoFill(true)}>Sí</Button>
                <Button variant="outline" onClick={() => handleAutoFill(false)}>No</Button>
              </div>
            </div>
          ) : selectedPaciente && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del tutor</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} required aria-invalid={!!fieldErrors.nombre} className={fieldErrors.nombre ? 'border-red-500' : ''} />
                {fieldErrors.nombre && <div className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</div>}
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={telefono} onChange={e => setTelefono(e.target.value)} required aria-invalid={!!fieldErrors.telefono} className={fieldErrors.telefono ? 'border-red-500' : ''} maxLength={10} />
                {fieldErrors.telefono && <div className="text-red-500 text-xs mt-1">{fieldErrors.telefono}</div>}
              </div>
              <div>
                <Label>Correo</Label>
                <Input value={correo} onChange={e => setCorreo(e.target.value)} required aria-invalid={!!fieldErrors.correo} className={fieldErrors.correo ? 'border-red-500' : ''} />
                {fieldErrors.correo && <div className="text-red-500 text-xs mt-1">{fieldErrors.correo}</div>}
              </div>
              <div>
                <Label>Relación con el paciente</Label>
                <select
                  value={relacion}
                  onChange={e => setRelacion(e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.relacion}
                  className={`w-full border rounded p-2 mt-1 bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary ${fieldErrors.relacion ? 'border-red-500' : ''}`}
                >
                  <option value="">Selecciona una opción</option>
                  {RELACIONES.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                {fieldErrors.relacion && <div className="text-red-500 text-xs mt-1">{fieldErrors.relacion}</div>}
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <DialogFooter>
                <Button variant="outline" type="button" onClick={onCancel} disabled={formDisabled}>Cancelar</Button>
                <Button type="submit" disabled={loading || formDisabled}>{loading ? 'Guardando...' : 'Guardar'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {showFingerprintModal && selectedPaciente && (
        <FingerprintModal
          open={showFingerprintModal}
          onClose={() => setShowFingerprintModal(false)}
          tutorId={newTutorId || 0}
          onSuccess={() => setShowFingerprintModal(false)}
          onExit={onSuccess}
        />
      )}
    </>
  );
};

export default TutorForm;
