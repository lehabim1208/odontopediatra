import React from 'react';
import TutorEditForm from './TutorEditForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TutorEditModalProps {
  open: boolean;
  onClose: () => void;
  tutor: any;
  onUpdated: () => void;
  paciente: any;
}

const TutorEditModal: React.FC<TutorEditModalProps> = ({ open, onClose, tutor, onUpdated, paciente }) => {
  if (!tutor) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tutor</DialogTitle>
        </DialogHeader>
        <TutorEditForm
          tutor={tutor}
          onSuccess={onClose}
          onTutorUpdated={onUpdated}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TutorEditModal;
