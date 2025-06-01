import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TutorDeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tutorName?: string;
}

const TutorDeleteConfirm: React.FC<TutorDeleteConfirmProps> = ({ open, onClose, onConfirm, tutorName }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Eliminar tutor</DialogTitle>
      </DialogHeader>
      <div className="mb-4">
        ¿Estás seguro que deseas eliminar al tutor <b>{tutorName}</b>? Esta acción no se puede deshacer.
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant="destructive" onClick={onConfirm}>Eliminar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default TutorDeleteConfirm;
