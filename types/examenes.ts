export interface Examenes {
    id?: number;
    id_paciente: number;
    exm_tipo_denticion?: string | null;
    exm_relacion_molar_clase?: string | null;
    exm_relacion_molar_derecho?: string | null;
    exm_relacion_molar_izquierdo?: string | null;
    exm_relacion_canina_clase?: string | null;
    exm_relacion_canina_derecho?: string | null;
    exm_relacion_canina_izquierdo?: string | null;
    exm_plano_terminal_recto_derecho?: string | null;
    exm_plano_terminal_recto_izquierdo?: string | null;
    exm_plano_terminal_mesial_derecho?: string | null;
    exm_plano_terminal_mesial_izquierdo?: string | null;
    exm_plano_terminal_distal_derecho?: string | null;
    exm_plano_terminal_distal_izquierdo?: string | null;
    exm_plano_terminal_mesian_exagerado_derecho?: string | null;
    exm_plano_terminal_mesian_exagerado_izquierdo?: string | null;
    exm_espaciada_arco_maxilar?: string | null;
    exm_espaciada_arco_mandibular?: string | null;
    exm_cerrada_arco_maxilar?: string | null;
    exm_cerrada_arco_mandibular?: string | null;
    exm_clasificacion_angle?: string | null;
    exm_mordida_cruzada?: string | null;
    exm_linea_media_dentaria_mandibular?: string | null;
    exm_linea_media_dentaria_maxilar?: string | null;
    exm_rotaciones?: string | null;
    exm_apianamiento?: string | null;
    exm_espacios?: string | null;
    exm_over_jet?: string | null;
    exm_over_bite?: string | null;
    exm_sintomatologia_atm?: string | null;
    exm_interferencias_oclusales?: string | null;
}