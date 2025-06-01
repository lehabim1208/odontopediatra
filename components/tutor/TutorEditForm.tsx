import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

const RELACIONES = [
  'Papá', 'Mamá', 'Abuela', 'Abuelo', 'Tía', 'Tío', 'Hermana', 'Hermano',
  'Prima', 'Primo', 'Bisabuela', 'Bisabuelo', 'Cuidador', 'Otro'
];

interface TutorEditFormProps {
  tutor: any;
  onSuccess: () => void;
  onCancel: () => void;
  onTutorUpdated?: () => void;
}

const TutorEditForm: React.FC<TutorEditFormProps> = ({ tutor, onSuccess, onCancel, onTutorUpdated }) => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [relacion, setRelacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (tutor) {
      setNombre(tutor.nombre || '');
      setTelefono(tutor.telefono || '');
      setCorreo(tutor.correo || '');
      setRelacion(tutor.relacion || '');
    }
  }, [tutor]);

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
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tutores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tutor.id,
          nombre,
          telefono,
          correo,
          relacion,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al actualizar tutor');
      if (onTutorUpdated) onTutorUpdated();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
      </DialogFooter>
    </form>
  );
};

export default TutorEditForm;
