export interface HeredoFamiliares {
    id?: number;
    id_paciente: number;
    abuelo_paterno?: string | null;
    abuela_paterna?: string | null;
    abuelo_materno?: string | null;
    abuela_materna?: string | null;
    madre?: string | null;
    padre?: string | null;
    otros_familiares?: string | null;
    no_sabe?: boolean | null;
    tuberculosis?: boolean | null;
    diabetes?: boolean | null;
    hipertension?: boolean | null;
    carcinomas?: boolean | null;
    cardiopatias?: boolean | null;
    hepatitis?: boolean | null;
    nefropatias?: boolean | null;
    endocrinas?: boolean | null;
    mentales?: boolean | null;
    epilepsia?: boolean | null;
    asma?: boolean | null;
    hematologicas?: boolean | null;
    sifilis?: boolean | null;
}