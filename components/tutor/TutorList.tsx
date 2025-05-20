import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/loading-spinner';

interface TutorListProps {
  tutores: any[];
  loading?: boolean;
  onRegistrarHuella?: (tutorId: number) => void;
  tutoresEnActualizacion?: number[];
}

const TutorList: React.FC<TutorListProps> = ({ tutores, loading = false, onRegistrarHuella, tutoresEnActualizacion = [] }) => {
  if (loading) {
    return <div className="text-muted-foreground text-sm">Cargando tutores...</div>;
  }
  if (!tutores || tutores.length === 0) {
    return <div className="text-muted-foreground text-sm">No hay tutores registrados para este paciente.</div>;
  }
  return (
    <ScrollArea className="max-h-64 w-full">
      <div className="flex flex-col gap-4">
        {tutores.map((tutor) => (
          <Card key={tutor.id} className="border p-2 min-w-[260px] max-w-xs w-full">
            <CardContent className="p-2 flex flex-col gap-1">
              <div><b>Nombre:</b> {tutor.nombre}</div>
              <div><b>Relación:</b> {tutor.relacion || '—'}</div>
              <div><b>Teléfono:</b> {tutor.telefono || '—'}</div>
              <div><b>Correo:</b> {tutor.correo || '—'}</div>
              <div>
                <b>Huella:</b>{' '}
                {tutoresEnActualizacion.includes(tutor.id) ? (
                  <span style={{ color: '#2563eb', fontWeight: 500 }}>Cargando...</span>
                ) : tutor.huella_id != null && tutor.huella_id !== undefined ? (
                  <span style={{ color: 'green', fontWeight: 500 }}>Registrada</span>
                ) : (
                  <span style={{ color: '#888', fontWeight: 500 }}>Pendiente</span>
                )}
              </div>
              {!tutoresEnActualizacion.includes(tutor.id) && (tutor.huella_id == null || tutor.huella_id === undefined) && (
                <div className="mt-2">
                  <Button size="sm" onClick={() => onRegistrarHuella && onRegistrarHuella(tutor.id)}>
                    Registrar huella
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TutorList;
