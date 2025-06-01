import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

// Tipos reutilizados
import type { Patient } from "@/components/PatientTreatmentsSection";

interface EditMedicalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPatient: Patient | null;
  editPatientInfo: any;
  setEditPatientInfo: (info: any) => void;
  additionalInfo: any;
  setAdditionalInfo: (info: any) => void;
  handleAddAdditionalInfo: () => void;
  showTermsDialog: boolean;
  setShowTermsDialog: (open: boolean) => void;
  addEditPhoneField: () => void;
  removeEditPhoneField: (index: number) => void;
  handleEditPhoneInput: (e: React.ChangeEvent<HTMLInputElement>, isAdditional?: boolean, index?: number) => void;
}

const EditMedicalHistoryDialog: React.FC<EditMedicalHistoryDialogProps> = ({
  open,
  onOpenChange,
  selectedPatient,
  editPatientInfo,
  setEditPatientInfo,
  additionalInfo,
  setAdditionalInfo,
  handleAddAdditionalInfo,
  showTermsDialog,
  setShowTermsDialog,
  addEditPhoneField,
  removeEditPhoneField,
  handleEditPhoneInput,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>En construcción</DialogTitle>
          <DialogDescription>
            Esta sección estará disponible próximamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
          <p className="text-lg font-semibold text-yellow-700 text-center">Estamos trabajando en esta funcionalidad.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMedicalHistoryDialog;