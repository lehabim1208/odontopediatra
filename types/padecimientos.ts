export interface Padecimientos {
    id?: number;
    id_paciente: number;
    accidentes_cara?: boolean | null;
    operaciones_cara?: boolean | null;
    alergias?: boolean | null;
    problemas_oido?: boolean | null;
    problemas_nacimiento?: boolean | null;
    problemas_sangrado?: boolean | null;
    problemas_lenguaje?: boolean | null;
    problemas_respiracion?: boolean | null;
    padecimiento_asma?: boolean | null;
    anemia?: boolean | null;
    problemas_amigdalas?: boolean | null;
    padecimiento_diabetes?: boolean | null;
    padecimiento_epilepsia?: boolean | null;
    fiebre_reumatica?: boolean | null;
    enfermedades_corazon?: boolean | null;
    operacion_amigdalas?: boolean | null;
    dificultad_masticar?: boolean | null;
    ronca_dormir?: boolean | null;
    respira_boca?: boolean | null;
    chupa_dedo?: boolean | null;
    muerde_labio?: boolean | null;
    muerde_unas?: boolean | null;
    rechina_dientes?: boolean | null;
    enfermedades_transmision_sexual?: boolean | null;
}