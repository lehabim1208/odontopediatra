export interface Preguntas {
    id?: number;
    id_paciente: number;
    consulta_ortodoncia?: boolean | null;
    cuando_ortodoncia?: string | null;
    porque_ortodoncia?: string | null;
    resultado_ortodoncia?: string | null;
    problema_mordida?: boolean | null;
    comentarios_problema?: boolean | null;
}