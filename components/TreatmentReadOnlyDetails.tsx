import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Fingerprint, Download, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";

interface TreatmentRow {
  id: string;
  toothNumber: string;
  conventionalTreatment: string;
  recommendedTreatment: string;
  conventionalPrice: number;
  recommendedPrice: number;
}

interface TreatmentReadOnlyDetailsProps {
  treatment: {
    rows: TreatmentRow[];
    conventionalTotal: number;
    recommendedTotal: number;
    approvedType?: "conventional" | "recommended";
    fingerprintData?: string | null;
    approvedDate?: string;
    approvedByName?: string; // Nuevo: nombre del tutor que aprobó
  };
  patient: {
    name: string;
    age: number;
    guardian: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPDF?: () => void; // NUEVO
  downloadingPDF?: boolean;
}

export default function TreatmentReadOnlyDetails({ treatment, patient, open, onOpenChange, onDownloadPDF, downloadingPDF }: TreatmentReadOnlyDetailsProps) {
  if (!treatment) {
    return (
      <DialogContent>
        <div className="p-8 text-center text-muted-foreground">Cargando información del tratamiento...</div>
      </DialogContent>
    );
  }

  const [rows, setRows] = useState<TreatmentRow[]>(treatment.rows || []);
  const [conventionalTotal, setConventionalTotal] = useState<number>(treatment.conventionalTotal ?? 0);
  const [recommendedTotal, setRecommendedTotal] = useState<number>(treatment.recommendedTotal ?? 0);
  const [approvedDate, setApprovedDate] = useState<string>("");
  const [hash, setHash] = useState<string | null>(treatment.fingerprintData ?? null);
  const [approvedType, setApprovedType] = useState<string | undefined>(treatment.approvedType);
  const [patientData, setPatientData] = useState<{ name: string; age: number; guardian: string }>(patient);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && (treatment as any).id) {
      setLoading(true);
      fetch(`/api/treatment_readonly_details?id=${(treatment as any).id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.tratamiento && data.patient) {
            setRows(data.tratamiento.rows || []);
            setConventionalTotal(
              typeof data.tratamiento.convencionalTotal === 'number'
                ? data.tratamiento.convencionalTotal
                : Number(data.tratamiento.convencionalTotal) || 0
            );
            setRecommendedTotal(
              typeof data.tratamiento.recommendedTotal === 'number'
                ? data.tratamiento.recommendedTotal
                : Number(data.tratamiento.recommendedTotal) || 0
            );
            setHash(data.tratamiento.fingerprintData ?? null);
            setApprovedType(data.tratamiento.approvedType);
            setPatientData({
              name: data.patient.name || '-',
              age: data.patient.age || '-',
              guardian: data.patient.guardian || '-',
            });
            if (data.tratamiento.approvedDate) {
              try {
                setApprovedDate(format(new Date(data.tratamiento.approvedDate), "d 'de' MMMM, yyyy HH:mm", { locale: es }));
              } catch {
                setApprovedDate(data.tratamiento.approvedDate);
              }
            } else {
              setApprovedDate('-');
            }
          }
        })
        .finally(() => setLoading(false));
    } else if (open) {
      // fallback: usar props
      setRows(treatment.rows || []);
      setConventionalTotal(
        typeof treatment.conventionalTotal === 'number'
          ? treatment.conventionalTotal
          : Number(treatment.conventionalTotal) || 0
      );
      setRecommendedTotal(
        typeof treatment.recommendedTotal === 'number'
          ? treatment.recommendedTotal
          : Number(treatment.recommendedTotal) || 0
      );
      setHash(treatment.fingerprintData ?? null);
      setApprovedType(treatment.approvedType);
      setPatientData(patient);
      if (treatment.approvedDate) {
        try {
          setApprovedDate(format(new Date(treatment.approvedDate), "d 'de' MMMM, yyyy HH:mm", { locale: es }));
        } catch {
          setApprovedDate(treatment.approvedDate);
        }
      } else {
        setApprovedDate('-');
      }
    }
    // eslint-disable-next-line
  }, [open, (treatment as any).id]);

  const hasRows = Array.isArray(rows) && rows.length > 0;
  return (
    <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle className="section-title text-blue-700">Tratamiento aprobado</DialogTitle>
        <DialogDescription>Información completa del tratamiento aprobado</DialogDescription>
        <div className="mt-2 mb-2">
          <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-700 font-semibold text-sm">Estatus de tratamiento: Aprobado</span>
        </div>
      </DialogHeader>
      <ScrollArea className="max-h-[calc(90vh-180px)]">
        <div className="space-y-6 p-1">
          <div className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Información del paciente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><b>Paciente:</b> {patientData.name}</p>
                <p><b>Edad:</b> {patientData.age} años</p>
                <p><b>Tutor que aprobó:</b> {patientData.guardian}</p>
                <p><b>Fecha de aprobación:</b> {approvedDate || '-'}</p>
                <p><b>Tipo de tratamiento aprobado:</b> {approvedType === 'conventional' || approvedType === 'convencional' ? 'Convencional' : approvedType === 'recommended' || approvedType === 'recomendado' ? 'Recomendado' : '-'}</p>
                {hash && (
                  <p style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                    <b>Hash de aprobación:</b>
                    <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                      <code className="bg-green-100 px-1 py-0.5 rounded text-xs text-green-800 font-mono font-bold select-all" style={{fontSize: '0.85rem'}}>{hash.substring(0, 32)}...</code>
                      <Fingerprint className="text-green-600" style={{width: '1.2rem', height: '1.2rem'}} />
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2 mt-4">Detalle del tratamiento</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Órgano dentario</TableHead>
                    <TableHead>Tratamiento convencional</TableHead>
                    <TableHead>Tratamiento recomendado</TableHead>
                    <TableHead className="w-[120px]">Precio conv.</TableHead>
                    <TableHead className="w-[120px]">Precio recom.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Cargando...</TableCell>
                    </TableRow>
                  ) : hasRows ? rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.toothNumber}</TableCell>
                      <TableCell>{row.conventionalTreatment}</TableCell>
                      <TableCell>{row.recommendedTreatment}</TableCell>
                      <TableCell>{row.conventionalPrice !== undefined && row.conventionalPrice !== null && `${row.conventionalPrice}` !== '' ? `$${Number(row.conventionalPrice).toLocaleString()}` : '-'}</TableCell>
                      <TableCell>{row.recommendedPrice !== undefined && row.recommendedPrice !== null && `${row.recommendedPrice}` !== '' ? `$${Number(row.recommendedPrice).toLocaleString()}` : '-'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Sin datos de tratamiento</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center items-center mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-12 w-full max-w-xl">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total tratamiento convencional:</p>
                  <p className="text-xl font-semibold">${typeof conventionalTotal === 'number' ? Number(conventionalTotal).toLocaleString() : '-'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total tratamiento recomendado:</p>
                  <p className="text-xl font-semibold">${typeof recommendedTotal === 'number' ? Number(recommendedTotal).toLocaleString() : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cerrar</Button>
        {onDownloadPDF && (
          <Button
            onClick={onDownloadPDF}
            className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
            disabled={!!downloadingPDF}
          >
            {downloadingPDF ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Descargando...
              </>
            ) : (
              <>
                <Download className="mr-2" /> Descargar PDF
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
