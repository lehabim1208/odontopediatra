export interface NoPatogenos {
    id?: number;
    id_paciente: number;
    cepillo?: string | null;
    habitacion?: string | null;
    tabaquismo?: boolean | null;
    alcoholismo?: boolean | null;
    alimentacion?: string | null;
    inmunizaciones?: string | null;
    pasatiempos?: string | null;
    vida_sexual?: string | null;
}