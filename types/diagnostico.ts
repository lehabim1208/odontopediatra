export interface Diagnostico {
    id?: number;
    id_paciente: number;
    diag_examenes_laboratorio?: string | null;
    diag_estudios_gabinete?: string | null;
    diag_diagnostico?: string | null;
    diag_pronostico?: string | null;
    diag_plan_tratamiento?: string | null;
}