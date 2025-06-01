export interface AparatosYSistemas {
    id?: number;
    id_paciente: number;
    aparato_digestivo?: string | null;
    aparato_cardiovascular?: string | null;
    aparato_respiratorio?: string | null;
    aparato_genito_urinario?: string | null;
    sistema_endocrino?: string | null;
    sistema_nervioso?: string | null;
}