import React, { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import TreatmentReadOnlyDetails from "@/components/TreatmentReadOnlyDetails";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PatientTreatmentsApprovedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: any;
  patient: any;
  tutor?: any;
}

export default function PatientTreatmentsApprovedModal({ open, onOpenChange, treatment, patient }: PatientTreatmentsApprovedModalProps) {
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (open && treatment?.id) {
      setLoading(true);
      fetch(`/api/treatment_readonly_details?id=${treatment.id}`)
        .then(res => res.json())
        .then(data => {
          setFullData(data);
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setFullData(null);
    }
  }, [open, treatment?.id]);

  // Usar los datos completos si están disponibles, si no, fallback a props
  const details = fullData && fullData.tratamiento ? fullData.tratamiento : treatment;
  const patientData = fullData && fullData.patient ? fullData.patient : patient;

  // Formatear la fecha de aprobación
  let approvedDate = details?.approvedDate;
  if (approvedDate) {
    try {
      let dateOnly = approvedDate;
      if (dateOnly.includes('T')) dateOnly = dateOnly.split('T')[0];
      if (dateOnly.includes(' ')) dateOnly = dateOnly.split(' ')[0];
      const [year, month, day] = dateOnly.split('-');
      if (year && month && day) {
        approvedDate = format(new Date(Number(year), Number(month) - 1, Number(day)), "d 'de' MMMM, yyyy", { locale: es });
      } else {
        approvedDate = format(new Date(dateOnly), "d 'de' MMMM, yyyy", { locale: es });
      }
    } catch {
      // fallback, dejar como está
    }
  } else {
    approvedDate = '-';
  }

  // --- PDF Download logic ---
  const handleDownloadPDF = () => {
    if (downloadingPDF) return; // Evita doble descarga
    setDownloadingPDF(true);
    const rows = details?.rows || [];
    // Calcular totales desde los datos completos si existen
    let conventionalTotal = 0;
    let recommendedTotal = 0;
    if (Array.isArray(rows) && rows.length > 0) {
      conventionalTotal = rows.reduce((sum, row) => sum + (Number(row.conventionalPrice) || 0), 0);
      recommendedTotal = rows.reduce((sum, row) => sum + (Number(row.recommendedPrice) || 0), 0);
    } else {
      conventionalTotal = typeof details?.conventionalTotal === 'number' ? details.conventionalTotal : Number(details?.conventionalTotal) || 0;
      recommendedTotal = typeof details?.recommendedTotal === 'number' ? details.recommendedTotal : Number(details?.recommendedTotal) || 0;
    }
    const approvedType = details?.approvedType;
    const hash = details?.fingerprintData ?? null;
    const approvedDatePDF = approvedDate;
    const patientName = patientData?.name || '-';
    const patientAge = patientData?.age || '-';
    const patientGuardian = patientData?.guardian || '-';
    const doc = new jsPDF();
    const margin = 15;
    const logoUrl = window.location.origin + "/images/logo-emmanuel-severino.png";
    const logoWidth = 50;
    const logoHeight = (2165 / 5906) * logoWidth;
    const img = new window.Image();
    img.src = logoUrl;
    img.onload = function () {
      let y = margin;
      doc.addImage(img, "PNG", margin, y, logoWidth, logoHeight);
      y += logoHeight + 4;
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text("Plan de Tratamiento Odontológico", margin, y);
      y += 10;
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94); // verde
      doc.text(`Estado: Aprobado`, margin, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.text(`Fecha de aprobación: ${approvedDatePDF}` , margin, y);
      y += 8;
      doc.text(`Tipo de tratamiento aprobado: ${approvedType === 'conventional' || approvedType === 'convencional' ? 'Convencional' : approvedType === 'recommended' || approvedType === 'recomendado' ? 'Recomendado' : '-'}` , margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // azul
      doc.text("Información del Paciente", margin, y);
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Nombre: ${patientName}`, margin, y);
      y += 7;
      doc.text(`Edad: ${patientAge} años`, margin, y);
      y += 7;
      doc.text(`Tutor que aprobó: ${patientGuardian}`, margin, y);
      y += 10;
      const tableBody = rows.map((row: any) => [
        row.toothNumber,
        row.conventionalTreatment,
        row.recommendedTreatment,
        row.conventionalPrice !== undefined && row.conventionalPrice !== null && `${row.conventionalPrice}` !== '' ? `$${Number(row.conventionalPrice).toLocaleString()}` : '-',
        row.recommendedPrice !== undefined && row.recommendedPrice !== null && `${row.recommendedPrice}` !== '' ? `$${Number(row.recommendedPrice).toLocaleString()}` : '-',
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
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Total tratamiento convencional: $${typeof conventionalTotal === 'number' ? Number(conventionalTotal).toLocaleString() : '-'}`,
        margin,
        y
      );
      y += 7;
      doc.text(
        `Total tratamiento recomendado: $${typeof recommendedTotal === 'number' ? Number(recommendedTotal).toLocaleString() : '-'}`,
        margin,
        y
      );
      y += 10;
      if (hash) {
        doc.setFontSize(10);
        doc.setTextColor(34, 197, 94); // verde
        doc.text(
          `Hash de aprobación: ${hash.substring(0, 32)}...`,
          margin,
          y
        );
        doc.setTextColor(0, 0, 0);
      }
      const safeDate = new Date();
      doc.save(
        `Tratamiento_${(patientName || '').replace(/\s+/g, "_")}_${format(safeDate, "yyyyMMdd_HHmm")}.pdf`
      );
      setTimeout(() => setDownloadingPDF(false), 500); // Da tiempo a guardar el archivo
    };
    if (img.complete) img.onload && img.onload(null as any);
  };

  // No renderizar el modal hasta que los datos estén listos (evita error de React)
  if (loading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <div className="p-8 text-center text-muted-foreground">Cargando información del tratamiento...</div>
      </Dialog>
    );
  }
  if (!details) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TreatmentReadOnlyDetails
        treatment={details}
        patient={patientData}
        open={open}
        onOpenChange={onOpenChange}
        onDownloadPDF={handleDownloadPDF}
        downloadingPDF={downloadingPDF}
      />
    </Dialog>
  );
}
