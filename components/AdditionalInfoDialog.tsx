import React, { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { LoadingSpinner } from "./loading-spinner";
import type { FichaIdentificacion } from '../types/ficha_identificacion';
import type { HeredoFamiliares } from '../types/heredo_familiares';
import type { NoPatogenos } from '../types/no_patogenos';
import type { Padecimientos } from '../types/padecimientos';
import type { Preguntas } from '../types/preguntas';
import type { AparatosYSistemas } from '../types/aparatos_y_sistemas';
import type { ExploracionGeneral } from '../types/exploracion_general';
import type { Examenes } from '../types/examenes';
import type { Diagnostico } from '../types/diagnostico';

// 1. Define el estado inicial fuera del componente (ajusta los campos según tus necesidades)
const initialPatientInfo = {
    // Ficha de identificación
    nombre: "",
    edad: "",
    sexo: "",
    nacionalidad: "",
    estado_civil: "",
    ocupacion: "",
    medico: "",
    telefono: "",
    lugar_origen: "",
    lugar_residencia: "",
    fecha_nacimiento: "",
    domicilio: "",
    region: "",
    correo: "",
    emergencia: "",
    talla_peso_nacimiento: "",
    tipo_parto: "",
    padre_tutor: "",
    ultimo_examen_dental: "",
    motivo_consulta: "",
    interes_tratamiento: "",
    // Antecedentes heredo-familiares
    abuelo_paterno: "",
    abuela_paterna: "",
    abuelo_materno: "",
    abuela_materna: "",
    madre: "",
    padre: "",
    otros_familiares: "",
    no_sabe: false,
    tuberculosis: false,
    diabetes: false,
    hipertension: false,
    carcinomas: false,
    cardiopatias: false,
    hepatitis: false,
    nefropatias: false,
    endocrinas: false,
    mentales: false,
    epilepsia: false,
    asma: false,
    hematologicas: false,
    sifilis: false,
    // No patogenos
    cepillo: "",
    habitacion: "",
    tabaquismo: false,
    alcoholismo: false,
    alimentacion: "",
    inmunizaciones: "",
    pasatiempos: "",
    vida_sexual: "",
    // Padecimientos
    accidentes_cara: false,
    operaciones_cara: false,
    alergias: false,
    problemas_oido: false,
    problemas_nacimiento: false,
    problemas_sangrado: false,
    problemas_lenguaje: false,
    problemas_respiracion: false,
    padecimiento_asma: false,
    anemia: false,
    problemas_amigdalas: false,
    padecimiento_diabetes: false,
    padecimiento_epilepsia: false,
    fiebre_reumatica: false,
    enfermedades_corazon: false,
    operacion_amigdalas: false,
    dificultad_masticar: false,
    ronca_dormir: false,
    respira_boca: false,
    chupa_dedo: false,
    muerde_labio: false,
    muerde_unas: false,
    rechina_dientes: false,
    enfermedades_transmision_sexual: false,
    // Interrogatorio por Aparatos y Sistemas 
    aparato_digestivo: "",
    aparato_cardiovascular: "",
    aparato_respiratorio: "",
    aparato_genito_urinario: "",
    sistema_endocrino: "",
    sistema_nervioso: "",
    // Exploracion general
    exg_presion_arterial: "",
    exg_frecuencia_respiratoria: "",
    exg_pulso: "",
    exg_temperatura: "",
    exg_frecuencia_cardiaca: "",
    exg_peso_actual: "",
    exg_talla: "",
    exg_cabeza: "",
    exg_cuello: "",
    exg_higiene: "",
    exg_periodonto: "",
    exg_prevalencia_caries: "",
    exg_denticion: "",
    exg_dientes_faltantes: "",
    exg_dientes_retenidos: "",
    exg_dientes_impactados: "",
    exg_descalcificacion_dientes: "",
    exg_insercion_frenillos: "",
    exg_labios: "",
    exg_proporcion_lengua_arcos: "",
    exg_problemas_lenguaje: "",
    exg_terceros_molares: "",
    exg_habitos: "",
    exg_tipo_perfil: "",
    exg_tipo_craneo: "",
    exg_tipo_cara: "",
    exg_forma_arcadas_dentarias: "",
    exg_forma_paladar: "",
    exg_observaciones_especiales: "",
    // Examenes
    exm_tipo_denticion: "",
    exm_relacion_molar_clase: "",
    exm_relacion_molar_derecho: "",
    exm_relacion_molar_izquierdo: "",
    exm_relacion_canina_clase: "",
    exm_relacion_canina_derecho: "",
    exm_relacion_canina_izquierdo: "",
    exm_plano_terminal_recto_derecho: "",
    exm_plano_terminal_recto_izquierdo: "",
    exm_plano_terminal_mesial_derecho: "",
    exm_plano_terminal_mesial_izquierdo: "",
    exm_plano_terminal_distal_derecho: "",
    exm_plano_terminal_distal_izquierdo: "",
    exm_plano_terminal_mesian_exagerado_derecho: "",
    exm_plano_terminal_mesian_exagerado_izquierdo: "",
    exm_espaciada_arco_maxilar: "",
    exm_espaciada_arco_mandibular: "",
    exm_cerrada_arco_maxilar: "",
    exm_cerrada_arco_mandibular: "",
    exm_clasificacion_angle: "",
    exm_mordida_cruzada: "",
    exm_linea_media_dentaria_mandibular: "",
    exm_linea_media_dentaria_maxilar: "",
    exm_rotaciones: "",
    exm_apianamiento: "",
    exm_espacios: "",
    exm_over_jet: "",
    exm_over_bite: "",
    exm_sintomatologia_atm: "",
    exm_interferencias_oclusales: "",
    // Diagramas
    diag_examenes_laboratorio: "",
    diag_estudios_gabinete: "",
    diag_diagnostico: "",
    diag_pronostico: "",
    diag_plan_tratamiento: "",
    // Otros campos que puedas necesitar
};

interface AdditionalInfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void

    selectedPatient: { id: string; name: string; age?: number; guardian?: string; phone?: string; email?: string } | null
    editPatientInfo: any
    setEditPatientInfo: React.Dispatch<React.SetStateAction<any>>

    showTermsDialog: boolean
    setShowTermsDialog: (open: boolean) => void
}

export const AdditionalInfoDialog: React.FC<AdditionalInfoDialogProps> = ({
    open,
    onOpenChange,
    selectedPatient,
    editPatientInfo,
    setEditPatientInfo,
    showTermsDialog,
    setShowTermsDialog,
}) => {
    // Estado para controlar qué acordeones están abiertos
    const [openSections, setOpenSections] = useState<string[]>([]);

    // Estados para los datos de cada sección
    const [fichaIdentificacion, setFichaIdentificacion] = useState<any>(null);
    const [heredoFamiliares, setHeredoFamiliares] = useState<any>(null);
    const [noPatologicos, setNoPatologicos] = useState<any>(null);
    const [padecimientos, setPadecimientos] = useState<any>(null);
    const [preguntas, setPreguntas] = useState<any>(null);
    const [interrogatorio, setInterrogatorio] = useState<any>(null);
    const [exploracion, setExploracion] = useState<any>(null);
    const [examenes, setExamenes] = useState<any>(null);
    const [diagnostico, setDiagnostico] = useState<any>(null);
    const [consentimiento, setConsentimiento] = useState<any>(null);

    // Estados de loading y error por sección
    const [loadingSection, setLoadingSection] = useState<string | null>(null);
    const [savingSection, setSavingSection] = useState<string | null>(null);
    const [errorSection, setErrorSection] = useState<string | null>(null);

    // --- FETCH Y UPDATE POR SECCIÓN ---
    const fetchSectionData = useCallback(async (section: string) => {
        if (!selectedPatient) return;
        setLoadingSection(section);
        setErrorSection(null);
        try {
            let res: Response;
            let data: Record<string, any> | null = null;
            switch (section) {
                case "identificacion":
                    res = await fetch(`/api/hismed01_ficha_identificacion?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setFichaIdentificacion(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "heredo-familiares":
                    res = await fetch(`/api/hismed02_heredo_familiares?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setHeredoFamiliares(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "no-patologicos":
                    res = await fetch(`/api/hismed03_no_patogenos?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setNoPatologicos(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "padecimientos":
                    res = await fetch(`/api/hismed04_padecimientos?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setPadecimientos(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "preguntas":
                    res = await fetch(`/api/hismed05_preguntas?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setPreguntas(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "interrogatorio":
                    res = await fetch(`/api/hismed06_aparatos_y_sistemas?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setInterrogatorio(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "exploracion":
                    res = await fetch(`/api/hismed07_exploracion_general?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setExploracion(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "examenes":
                    res = await fetch(`/api/hismed08_examenes?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setExamenes(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "diagnostico":
                    res = await fetch(`/api/hismed09_diagnostico?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setDiagnostico(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                case "consentimiento":
                    res = await fetch(`/api/hismed10_consentimiento?id_paciente=${selectedPatient.id}`);
                    data = await res.json();
                    setConsentimiento(data?.data ?? {});
                    setEditPatientInfo((prev: any) => ({ ...prev, ...(data?.data ?? {}) }));
                    break;
                default:
                    break;
            }
        } catch (err) {
            setErrorSection(section);
        } finally {
            setLoadingSection(null);
        }
    }, [selectedPatient, setEditPatientInfo]);

    const updateSectionData = useCallback(async (section: string, data: any) => {
        if (!selectedPatient) return;
        setSavingSection(section);
        setErrorSection(null);
        try {
            let url = "";
            let method = "PUT";
            let body = { ...data, id_paciente: selectedPatient.id };
            if (section === "identificacion") {
                url = `/api/hismed01_ficha_identificacion`;
                method = "PATCH";
                // Solo enviar los campos que cambiaron respecto a fichaIdentificacion
                const changed: Record<string, any> = { id_paciente: selectedPatient.id };
                for (const key in data) {
                    if (data[key] !== fichaIdentificacion?.[key]) {
                        changed[key] = data[key];
                    }
                }
                // Si no hay cambios, no hacer request
                if (Object.keys(changed).length === 1) {
                    setSavingSection(null);
                    return;
                }
                body = changed;
            } else {
                switch (section) {
                    case "heredo-familiares":
                        url = `/api/hismed02_heredo_familiares`;
                        break;
                    case "no-patologicos":
                        url = `/api/hismed03_no_patogenos`;
                        break;
                    case "padecimientos":
                        url = `/api/hismed04_padecimientos`;
                        break;
                    case "preguntas":
                        url = `/api/hismed05_preguntas`;
                        break;
                    case "interrogatorio":
                        url = `/api/hismed06_aparatos_y_sistemas`;
                        break;
                    case "exploracion":
                        url = `/api/hismed07_exploracion_general`;
                        break;
                    case "examenes":
                        url = `/api/hismed08_examenes`;
                        break;
                    case "diagnostico":
                        url = `/api/hismed09_diagnostico`;
                        break;
                    case "consentimiento":
                        url = `/api/hismed10_consentimiento`;
                        break;
                    default:
                        break;
                }
            }
            await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (err) {
            setErrorSection(section);
        } finally {
            setSavingSection(null);
        }
    }, [selectedPatient, fichaIdentificacion]);

    // Handler para cuando se abre/cierra un acordeón
    const handleAccordionChange = async (sections: string[]) => {
        const newlyOpened = sections.filter(s => !openSections.includes(s));
        for (const section of newlyOpened) {
            await fetchSectionData(section);
        }
        setOpenSections(sections);
    };

    // const handleEditPhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const phone = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    //     setEditPatientInfo({ ...editPatientInfo, phone });
    // };

    useEffect(() => {
        // Elimina el useEffect que carga todos los datos al abrir el modal
    }, [open, selectedPatient]);

    const saveAdditionalInfo = async () => {
        if (!selectedPatient) {
            alert("No hay paciente seleccionado");
            return;
        }

        const ficha: FichaIdentificacion = {
            id_paciente: Number(selectedPatient.id),
            nombre: editPatientInfo.nombre || null,
            edad: editPatientInfo.edad ? Number(editPatientInfo.edad) : null,
            sexo: editPatientInfo.sexo || null,
            nacionalidad: editPatientInfo.nacionalidad || null,
            estado_civil: editPatientInfo.estado_civil || null,
            ocupacion: editPatientInfo.ocupacion || null,
            medico: editPatientInfo.medico || null,
            telefono: editPatientInfo.telefono || null,
            lugar_origen: editPatientInfo.lugar_origen || null,
            lugar_residencia: editPatientInfo.lugar_residencia || null,
            fecha_nacimiento: editPatientInfo.fecha_nacimiento || null,
            domicilio: editPatientInfo.domicilio || null,
            region: editPatientInfo.region || null,
            correo: editPatientInfo.correo || null,
            emergencia: editPatientInfo.emergencia || null,
            talla_peso_nacimiento: editPatientInfo.talla_peso_nacimiento || null,
            tipo_parto: editPatientInfo.tipo_parto || null,
            padre_tutor: editPatientInfo.padre_tutor || null,
            ultimo_examen_dental: editPatientInfo.ultimo_examen_dental || null,
            motivo_consulta: editPatientInfo.motivo_consulta || null,
            interes_tratamiento: editPatientInfo.interes_tratamiento || null
        };

        const heredoFamiliares: HeredoFamiliares = {
            id_paciente: Number(selectedPatient.id),
            abuelo_paterno: editPatientInfo.abuelo_paterno || null,
            abuela_paterna: editPatientInfo.abuela_paterna || null,
            abuelo_materno: editPatientInfo.abuelo_materno || null,
            abuela_materna: editPatientInfo.abuela_materna || null,
            madre: editPatientInfo.madre || null,
            padre: editPatientInfo.padre || null,
            otros_familiares: editPatientInfo.otros_familiares || null,
            no_sabe: !!editPatientInfo.no_sabe,
            tuberculosis: !!editPatientInfo.tuberculosis,
            diabetes: !!editPatientInfo.diabetes,
            hipertension: !!editPatientInfo.hipertension,
            carcinomas: !!editPatientInfo.carcinomas,
            cardiopatias: !!editPatientInfo.cardiopatias,
            hepatitis: !!editPatientInfo.hepatitis,
            nefropatias: !!editPatientInfo.nefropatias,
            endocrinas: !!editPatientInfo.endocrinas,
            mentales: !!editPatientInfo.mentales,
            epilepsia: !!editPatientInfo.epilepsia,
            asma: !!editPatientInfo.asma,
            hematologicas: !!editPatientInfo.hematologicas,
            sifilis: !!editPatientInfo.sifilis
        };

        const noPatogenos = {
            id_paciente: Number(selectedPatient.id),
            cepillo: editPatientInfo.cepillo || null,
            habitacion: editPatientInfo.habitacion || null,
            tabaquismo: !!editPatientInfo.tabaquismo,
            alcoholismo: !!editPatientInfo.alcoholismo,
            alimentacion: editPatientInfo.alimentacion || null,
            inmunizaciones: editPatientInfo.inmunizaciones || null,
            pasatiempos: editPatientInfo.pasatiempos || null,
            vida_sexual: editPatientInfo.vida_sexual || null
        };

        const padecimientos = {
            id_paciente: Number(selectedPatient.id),
            accidentes_cara: !!editPatientInfo.accidentes_cara,
            operaciones_cara: !!editPatientInfo.operaciones_cara,
            alergias: !!editPatientInfo.alergias,
            problemas_oido: !!editPatientInfo.problemas_oido,
            problemas_nacimiento: !!editPatientInfo.problemas_nacimiento,
            problemas_sangrado: !!editPatientInfo.problemas_sangrado,
            problemas_lenguaje: !!editPatientInfo.problemas_lenguaje,
            problemas_respiracion: !!editPatientInfo.problemas_respiracion,
            padecimiento_asma: !!editPatientInfo.padecimiento_asma,
            anemia: !!editPatientInfo.anemia,
            problemas_amigdalas: !!editPatientInfo.problemas_amigdalas,
            padecimiento_diabetes: !!editPatientInfo.padecimiento_diabetes,
            padecimiento_epilepsia: !!editPatientInfo.padecimiento_epilepsia,
            fiebre_reumatica: !!editPatientInfo.fiebre_reumatica,
            enfermedades_corazon: !!editPatientInfo.enfermedades_corazon,
            operacion_amigdalas: !!editPatientInfo.operacion_amigdalas,
            dificultad_masticar: !!editPatientInfo.dificultad_masticar,
            ronca_dormir: !!editPatientInfo.ronca_dormir,
            respira_boca: !!editPatientInfo.respira_boca,
            chupa_dedo: !!editPatientInfo.chupa_dedo,
            muerde_labio: !!editPatientInfo.muerde_labio,
            muerde_unas: !!editPatientInfo.muerde_unas,
            rechina_dientes: !!editPatientInfo.rechina_dientes,
            enfermedades_transmision_sexual: !!editPatientInfo.enfermedades_transmision_sexual
        };

        const preguntas = {
            id_paciente: Number(selectedPatient.id),
            consulta_ortodoncia: editPatientInfo.consulta_ortodoncia || null,
            cuando_ortodoncia: editPatientInfo.cuando_ortodoncia || null,
            porque_ortodoncia: editPatientInfo.porque_ortodoncia || null,
            resultado_ortodoncia: editPatientInfo.resultado_ortodoncia || null,
            problema_mordida: !!editPatientInfo.problema_mordida,
            comentarios_problema: editPatientInfo.comentarios_problema || null
        };

        const aparatosYSistemas = {
            id_paciente: Number(selectedPatient.id),
            aparato_digestivo: editPatientInfo.aparato_digestivo || null,
            aparato_cardiovascular: editPatientInfo.aparato_cardiovascular || null,
            aparato_respiratorio: editPatientInfo.aparato_respiratorio || null,
            aparato_genito_urinario: editPatientInfo.aparato_genito_urinario || null,
            sistema_endocrino: editPatientInfo.sistema_endocrino || null,
            sistema_nervioso: editPatientInfo.sistema_nervioso || null
        };

        const exploracionGeneral = {
            id_paciente: Number(selectedPatient.id),
            exg_presion_arterial: editPatientInfo.exg_presion_arterial || null,
            exg_frecuencia_respiratoria: editPatientInfo.exg_frecuencia_respiratoria || null,
            exg_pulso: editPatientInfo.exg_pulso || null,
            exg_temperatura: editPatientInfo.exg_temperatura || null,
            exg_peso_actual: editPatientInfo.exg_peso_actual || null,
            exg_talla: editPatientInfo.exg_talla || null,
            exg_cabeza: editPatientInfo.exg_cabeza || null,
            exg_cuello: editPatientInfo.exg_cuello || null,
            exg_higiene: editPatientInfo.exg_higiene || null,
            exg_periodonto: editPatientInfo.exg_periodonto || null,
            exg_prevalencia_caries: editPatientInfo.exg_prevalencia_caries || null,
            exg_denticion: editPatientInfo.exg_denticion || null,
            exg_dientes_faltantes: editPatientInfo.exg_dientes_faltantes || null,
            exg_dientes_retenidos: editPatientInfo.exg_dientes_retenidos || null,
            exg_dientes_impactados: editPatientInfo.exg_dientes_impactados || null,
            exg_descalcificacion_dientes: editPatientInfo.exg_descalcificacion_dientes || null,
            exg_insercion_frenillos: editPatientInfo.exg_insercion_frenillos || null,
            exg_labios: editPatientInfo.exg_labios || null,
            exg_proporcion_lengua_arcos: editPatientInfo.exg_proporcion_lengua_arcos || null,
            exg_problemas_lenguaje: editPatientInfo.exg_problemas_lenguaje || null,
            exg_terceros_molares: editPatientInfo.exg_terceros_molares || null,
            exg_habitos: editPatientInfo.exg_habitos || null,
            exg_tipo_perfil: editPatientInfo.exg_tipo_perfil || null,
            exg_tipo_craneo: editPatientInfo.exg_tipo_craneo || null,
            exg_tipo_cara: editPatientInfo.exg_tipo_cara || null,
            exg_forma_arcadas_dentarias: editPatientInfo.exg_forma_arcadas_dentarias || null,
            exg_forma_paladar: editPatientInfo.exg_forma_paladar || null,
            exg_observaciones_especiales: editPatientInfo.exg_observaciones_especiales || null
        };

        const examenes = {
            id_paciente: Number(selectedPatient.id),
            exm_tipo_denticion: editPatientInfo.exm_tipo_denticion || null,
            exm_relacion_molar_clase: editPatientInfo.exm_relacion_molar_clase || null,
            exm_relacion_molar_derecho: editPatientInfo.exm_relacion_molar_derecho || null,
            exm_relacion_molar_izquierdo: editPatientInfo.exm_relacion_molar_izquierdo || null,
            exm_relacion_canina_clase: editPatientInfo.exm_relacion_canina_clase || null,
            exm_relacion_canina_derecho: editPatientInfo.exm_relacion_canina_derecho || null,
            exm_relacion_canina_izquierdo: editPatientInfo.exm_relacion_canina_izquierdo || null,
            exm_plano_terminal_recto_derecho: editPatientInfo.exm_plano_terminal_recto_derecho || null,
            exm_plano_terminal_recto_izquierdo: editPatientInfo.exm_plano_terminal_recto_izquierdo || null,
            exm_plano_terminal_mesial_derecho: editPatientInfo.exm_plano_terminal_mesial_derecho || null,
            exm_plano_terminal_mesial_izquierdo: editPatientInfo.exm_plano_terminal_mesial_izquierdo || null,
            exm_plano_terminal_distal_derecho: editPatientInfo.exm_plano_terminal_distal_derecho || null,
            exm_plano_terminal_distal_izquierdo: editPatientInfo.exm_plano_terminal_distal_izquierdo || null,
            exm_plano_terminal_mesian_exagerado_derecho: editPatientInfo.exm_plano_terminal_mesian_exagerado_derecho || null,
            exm_plano_terminal_mesian_exagerado_izquierdo: editPatientInfo.exm_plano_terminal_mesian_exagerado_izquierdo || null,
            exm_espaciada_arco_maxilar: editPatientInfo.exm_espaciada_arco_maxilar || null,
            exm_espaciada_arco_mandibular: editPatientInfo.exm_espaciada_arco_mandibular || null,
            exm_cerrada_arco_maxilar: editPatientInfo.exm_cerrada_arco_maxilar || null,
            exm_cerrada_arco_mandibular: editPatientInfo.exm_cerrada_arco_mandibular || null,
            exm_clasificacion_angle: editPatientInfo.exm_clasificacion_angle || null,
            exm_mordida_cruzada: editPatientInfo.exm_mordida_cruzada || null,
            exm_linea_media_dentaria_mandibular: editPatientInfo.exm_linea_media_dentaria_mandibular || null,
            exm_linea_media_dentaria_maxilar: editPatientInfo.exm_linea_media_dentaria_maxilar || null,
            exm_rotaciones: editPatientInfo.exm_rotaciones || null,
            exm_apianamiento: editPatientInfo.exm_apianamiento || null,
            exm_espacios: editPatientInfo.exm_espacios || null,
            exm_over_jet: editPatientInfo.exm_over_jet || null,
            exm_over_bite: editPatientInfo.exm_over_bite || null,
            exm_sintomatologia_atm: editPatientInfo.exm_sintomatologia_atm || null,
            exm_interferencias_oclusales: editPatientInfo.exm_interferencias_oclusales || null
        };

        const diagnostico = {
            id_paciente: Number(selectedPatient.id),
            diag_examenes_laboratorio: editPatientInfo.diag_examenes_laboratorio || null,
            diag_estudios_gabinete: editPatientInfo.diag_estudios_gabinete || null,
            diag_diagnostico: editPatientInfo.diag_diagnostico || null,
            diag_pronostico: editPatientInfo.diag_pronostico || null,
            diag_plan_tratamiento: editPatientInfo.diag_plan_tratamiento || null
        };

        // Función auxiliar homogénea
        const saveOrUpdate = async (apiUrl: string, id_paciente: number, data: any) => {
            let existe = false;
            try {
                const res = await fetch(`${apiUrl}?id_paciente=${id_paciente}`);
                if (res.ok) {
                    const json = await res.json();
                    existe = Array.isArray(json.data)
                        ? json.data.length > 0
                        : !!json.data;
                }
            } catch (error) {
                console.error("Error al verificar existencia en", apiUrl, error);
                return null;
            }

            const method = existe ? "PUT" : "POST";
            console.log(`Guardando datos en ${apiUrl} con método ${method}`, data);
            return fetch(apiUrl, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        };

        const response = await saveOrUpdate("/api/hismed01_ficha_identificacion", ficha.id_paciente, ficha);
        const responseHeredo = await saveOrUpdate("/api/hismed02_heredo_familiares", heredoFamiliares.id_paciente, heredoFamiliares);
        const responseNoPatogenos = await saveOrUpdate("/api/hismed03_no_patogenos", noPatogenos.id_paciente, noPatologicos);
        const responsePadecimientos = await saveOrUpdate("/api/hismed04_padecimientos", padecimientos.id_paciente, padecimientos);
        const responsePreguntas = await saveOrUpdate("/api/hismed05_preguntas", preguntas.id_paciente, preguntas);
        const responseAparatos = await saveOrUpdate("/api/hismed06_aparatos_y_sistemas", aparatosYSistemas.id_paciente, aparatosYSistemas);
        const responseExploracion = await saveOrUpdate("/api/hismed07_exploracion_general", exploracionGeneral.id_paciente, exploracionGeneral);
        const responseExamenes = await saveOrUpdate("/api/hismed08_examenes", examenes.id_paciente, examenes);
        const responseDiagnostico = await saveOrUpdate("/api/hismed09_diagnostico", diagnostico.id_paciente, diagnostico);

        if (response?.ok && responseHeredo?.ok && responseNoPatogenos?.ok && responsePadecimientos?.ok && responsePreguntas?.ok && responseAparatos?.ok && responseExploracion?.ok && responseExamenes?.ok && responseDiagnostico?.ok) {
            // actualiza paciente
            await fetch("/api/pacientes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedPatient.id,
                    nombre: editPatientInfo.nombre || "",
                    edad: editPatientInfo.edad || "",
                    padre_tutor: editPatientInfo.padre_tutor || "",
                    telefono: editPatientInfo.telefono || "",
                    correo: editPatientInfo.correo || "",
                }),
            });
            onOpenChange(false);
        } else {
            alert("Error al guardar los datos adicionales del paciente.");
        }
    };

    // 2. Función para limpiar el formulario
    const handleClose = () => {
        setEditPatientInfo(initialPatientInfo);
        setOpenSections([]); // Cierra todos los acordeones al cerrar el modal
        onOpenChange(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setOpenSections([]); // Cierra todos los acordeones al cerrar el modal
                    }
                    onOpenChange(isOpen);
                }}
            >
                <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-2xl font-bold text-primary">
                            {selectedPatient && `Editar historial médico para ${selectedPatient.name}`}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[calc(95vh-12rem)] px-6">
                        <div className="space-y-8 py-4 pr-4">
                            <Accordion type="multiple" className="w-full" value={openSections} onValueChange={handleAccordionChange}>
                                {/* Ficha de Identificación */}
                                <AccordionItem value="identificacion">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Ficha de Identificación
                                            {loadingSection === "identificacion" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {/* Loading y error */}
                                        {loadingSection === "identificacion" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "identificacion" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <Label>Nombre</Label>
                                                    <Input
                                                        value={editPatientInfo.nombre ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, nombre: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Edad</Label>
                                                    <Input
                                                        value={editPatientInfo.edad ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, edad: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Sexo</Label>
                                                    <Input
                                                        value={editPatientInfo.sexo ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, sexo: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Nacionalidad</Label>
                                                    <Input
                                                        value={editPatientInfo.nacionalidad ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, nacionalidad: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Estado Civil</Label>
                                                    <Input
                                                        value={editPatientInfo.estado_civil ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, estadoCivil: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Ocupación</Label>
                                                    <Input
                                                        value={editPatientInfo.ocupacion ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, ocupacion: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Médico</Label>
                                                    <Input
                                                        value={editPatientInfo.medico ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, medico: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Teléfono</Label>
                                                    <Input
                                                        value={editPatientInfo.telefono ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, telefono: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label>Lugar de Origen</Label>
                                                    <Input
                                                        value={editPatientInfo.lugar_origen ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, lugarOrigen: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Lugar de Residencia</Label>
                                                    <Input
                                                        value={editPatientInfo.lugar_residencia ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, lugarResidencia: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Fecha de Nacimiento</Label>
                                                    <Input
                                                        type="date"
                                                        value={editPatientInfo.fecha_nacimiento ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, fechaNacimiento: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <Label>Domicilio</Label>
                                                    <Input
                                                        value={editPatientInfo.domicilio ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, domicilio: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Región</Label>
                                                    <Input
                                                        value={editPatientInfo.region ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, region: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Correo</Label>
                                                    <Input
                                                        value={editPatientInfo.correo ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, correo: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>En caso de emergencia</Label>
                                                    <Input
                                                        value={editPatientInfo.emergencia ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, emergencia: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label>Talla y peso al nacer</Label>
                                                    <Input
                                                        value={editPatientInfo.talla_peso_nacimiento ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, tallaPesoNacimiento: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tipo de parto</Label>
                                                    <Input
                                                        value={editPatientInfo.tipo_parto ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, tipoParto: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Padre o tutor</Label>
                                                    <Input
                                                        value={editPatientInfo.padre_tutor ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, padre_tutor: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Fecha de su último examen dental</Label>
                                                    <Input
                                                        type="date"
                                                        value={editPatientInfo.ultimo_examen_dental ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, ultimoExamenDental: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Motivo de la consulta</Label>
                                                    <Input
                                                        value={editPatientInfo.motivo_consulta ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, motivoConsulta: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Interés del tratamiento</Label>
                                                <Input
                                                    value={editPatientInfo.interes_tratamiento ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, interesTratamiento: e.target.value })}
                                                />
                                            </div>
                                            <button
                                                className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                                disabled={savingSection === "identificacion"}
                                                onClick={() => updateSectionData("identificacion", {
                                                    nombre: editPatientInfo.nombre,
                                                    edad: editPatientInfo.edad,
                                                    sexo: editPatientInfo.sexo,
                                                    nacionalidad: editPatientInfo.nacionalidad,
                                                    estado_civil: editPatientInfo.estado_civil,
                                                    ocupacion: editPatientInfo.ocupacion,
                                                    medico: editPatientInfo.medico,
                                                    telefono: editPatientInfo.telefono,
                                                    lugar_origen: editPatientInfo.lugar_origen,
                                                    lugar_residencia: editPatientInfo.lugar_residencia,
                                                    fecha_nacimiento: editPatientInfo.fecha_nacimiento,
                                                    domicilio: editPatientInfo.domicilio,
                                                    region: editPatientInfo.region,
                                                    correo: editPatientInfo.correo,
                                                    emergencia: editPatientInfo.emergencia,
                                                    talla_peso_nacimiento: editPatientInfo.talla_peso_nacimiento,
                                                    tipo_parto: editPatientInfo.tipo_parto,
                                                    padre_tutor: editPatientInfo.padre_tutor,
                                                    ultimo_examen_dental: editPatientInfo.ultimo_examen_dental,
                                                    motivo_consulta: editPatientInfo.motivo_consulta,
                                                    interes_tratamiento: editPatientInfo.interes_tratamiento,
                                                })}
                                            >
                                                {savingSection === "identificacion" ? "Guardando..." : "Guardar sección"}
                                            </button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Heredo Familiares */}
                                <AccordionItem value="heredo-familiares">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Antecedentes Heredo-familiares
                                            {loadingSection === "heredo-familiares" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "heredo-familiares" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "heredo-familiares" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="font-semibold">a) Heredo Familiares:</Label>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                <div>
                                                    <Label>Abuelo paterno</Label>
                                                    <Input
                                                        value={editPatientInfo.abuelo_paterno ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, abuelo_paterno: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Abuela paterna</Label>
                                                    <Input
                                                        value={editPatientInfo.abuela_paterna ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, abuela_paterna: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Abuelo materno</Label>
                                                    <Input
                                                        value={editPatientInfo.abuelo_materno ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, abuelo_materno: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Abuela materna</Label>
                                                    <Input
                                                        value={editPatientInfo.abuela_materna ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, abuela_materna: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Madre</Label>
                                                    <Input
                                                        value={editPatientInfo.madre ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, madre: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Padre</Label>
                                                    <Input
                                                        value={editPatientInfo.padre ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, padre: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Otros</Label>
                                                <Input
                                                    value={editPatientInfo.otros_familiares ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, otros_familiares: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.no_sabe}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, no_sabe: checked })}
                                                    id="no_sabe"
                                                />
                                                <Label htmlFor="no_sabe">No sabe</Label>
                                            </div>
                                            <div>
                                                <Label className="font-semibold">Enfermedades Heredofamiliares (marque si aplica):</Label>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.tuberculosis}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, tuberculosis: checked })}
                                                        id="tuberculosis"
                                                    />
                                                    <Label htmlFor="tuberculosis">Tuberculosis</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.diabetes}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, diabetes: checked })}
                                                        id="diabetes"
                                                    />
                                                    <Label htmlFor="diabetes">Diabetes Mellitus</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.hipertension}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, hipertension: checked })}
                                                        id="hipertension"
                                                    />
                                                    <Label htmlFor="hipertension">Hipertensión</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.carcinomas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, carcinomas: checked })}
                                                        id="carcinomas"
                                                    />
                                                    <Label htmlFor="carcinomas">Carcinomas</Label>
                                                </div>
                                                <div className="space-y-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.cardiopatias}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, cardiopatias: checked })}
                                                        id="cardiopatias"
                                                    />
                                                    <Label htmlFor="cardiopatias">Cardiopatías</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.hepatitis}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, hepatitis: checked })}
                                                        id="hepatitis"
                                                    />
                                                    <Label htmlFor="hepatitis">Hepatitis</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.nefropatias}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, nefropatias: checked })}
                                                        id="nefropatias"
                                                    />
                                                    <Label htmlFor="nefropatias">Nefropatías</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.endocrinas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, endocrinas: checked })}
                                                        id="endocrinas"
                                                    />
                                                    <Label htmlFor="endocrinas">Enf. Endocrinas</Label>
                                                </div>
                                                <div className="space-y-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.mentales}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, mentales: checked })}
                                                        id="mentales"
                                                    />
                                                    <Label htmlFor="mentales">Enf. Mentales</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.epilepsia}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, epilepsia: checked })}
                                                        id="epilepsia"
                                                    />
                                                    <Label htmlFor="epilepsia">Epilepsia</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.asma}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, asma: checked })}
                                                        id="asma"
                                                    />
                                                    <Label htmlFor="asma">Asma</Label>
                                                    <Checkbox
                                                        checked={!!editPatientInfo.hematologicas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, hematologicas: checked })}
                                                        id="hematologicas"
                                                    />
                                                    <Label htmlFor="hematologicas">Enf. Hematológicas</Label>
                                                </div>
                                                <div className="space-y-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.sifilis}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, sifilis: checked })}
                                                        id="sifilis"
                                                    />
                                                    <Label htmlFor="sifilis">Sífilis</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "heredo-familiares"}
                                            onClick={() => updateSectionData("heredo-familiares", heredoFamiliares)}
                                        >
                                            {savingSection === "heredo-familiares" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* No Patológicos */}
                                <AccordionItem value="no-patologicos">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Antecedentes No Patológicos
                                            {loadingSection === "no-patologicos" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "no-patologicos" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "no-patologicos" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Cepillo</Label>
                                                    <Input
                                                        value={editPatientInfo.cepillo ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, cepillo: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Habitación</Label>
                                                    <Input
                                                        value={editPatientInfo.habitacion ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, habitacion: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.tabaquismo}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, tabaquismo: checked })}
                                                    id="tabaquismo"
                                                />
                                                <Label htmlFor="tabaquismo">Consume tabaco</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.alcoholismo}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, alcoholismo: checked })}
                                                    id="alcoholismo"
                                                />
                                                <Label htmlFor="alcoholismo">Consume alcohol</Label>
                                            </div>
                                            <div>
                                                <Label>Alimentación</Label>
                                                <Input
                                                    value={editPatientInfo.alimentacion ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, alimentacion: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Inmunizaciones</Label>
                                                <Input
                                                    value={editPatientInfo.inmunizaciones ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, inmunizaciones: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Pasatiempos</Label>
                                                <Input
                                                    value={editPatientInfo.pasatiempos ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, pasatiempos: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Vida sexual</Label>
                                                <Input
                                                    value={editPatientInfo.vida_sexual ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, vida_sexual: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "no-patologicos"}
                                            onClick={() => updateSectionData("no-patologicos", noPatologicos)}
                                        >
                                            {savingSection === "no-patologicos" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Padecimientos */}
                                <AccordionItem value="padecimientos">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Padecimientos
                                            {loadingSection === "padecimientos" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "padecimientos" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "padecimientos" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-2">
                                            <Label className="font-semibold">Marcar cuando la respuesta es sí</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.accidentes_cara}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, accidentes_cara: checked })}
                                                        id="accidentes_cara"
                                                    />
                                                    <Label htmlFor="accidentes_cara">Accidentes en la cara</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.operaciones_cara}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, operaciones_cara: checked })}
                                                        id="operaciones_cara"
                                                    />
                                                    <Label htmlFor="operaciones_cara">Operaciones en la cara</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.alergias}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, alergias: checked })}
                                                        id="alergias"
                                                    />
                                                    <Label htmlFor="alergias">Alergias</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_oido}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_oido: checked })}
                                                        id="problemas_oido"
                                                    />
                                                    <Label htmlFor="problemas_oido">Problemas de oído</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_nacimiento}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_nacimiento: checked })}
                                                        id="problemas_nacimiento"
                                                    />
                                                    <Label htmlFor="problemas_nacimiento">Problemas de nacimiento</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_sangrado}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_sangrado: checked })}
                                                        id="problemas_sangrado"
                                                    />
                                                    <Label htmlFor="problemas_sangrado">Problemas de sangrado</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_lenguaje}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_lenguaje: checked })}
                                                        id="problemas_lenguaje"
                                                    />
                                                    <Label htmlFor="problemas_lenguaje">Problemas de lenguaje</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_respiracion}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_respiracion: checked })}
                                                        id="problemas_respiracion"
                                                    />
                                                    <Label htmlFor="problemas_respiracion">Problemas de respiración</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.padecimiento_asma}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, padecimiento_asma: checked })}
                                                        id="padecimiento_asma"
                                                    />
                                                    <Label htmlFor="padecimiento_asma">Asma</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.anemia}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, anemia: checked })}
                                                        id="anemia"
                                                    />
                                                    <Label htmlFor="anemia">Anemia</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.problemas_amigdalas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problemas_amigdalas: checked })}
                                                        id="problemas_amigdalas"
                                                    />
                                                    <Label htmlFor="problemas_amigdalas">Problemas de amígdalas</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.padecimiento_diabetes}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, padecimiento_diabetes: checked })}
                                                        id="padecimiento_diabetes"
                                                    />
                                                    <Label htmlFor="padecimiento_diabetes">Diabetes</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.padecimiento_epilepsia}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, padecimiento_epilepsia: checked })}
                                                        id="padecimiento_epilepsia"
                                                    />
                                                    <Label htmlFor="padecimiento_epilepsia">Epilepsia</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.fiebre_reumatica}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, fiebre_reumatica: checked })}
                                                        id="fiebre_reumatica"
                                                    />
                                                    <Label htmlFor="fiebre_reumatica">Fiebre reumática</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.enfermedades_corazon}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, enfermedades_corazon: checked })}
                                                        id="enfermedades_corazon"
                                                    />
                                                    <Label htmlFor="enfermedades_corazon">Enfermedades de corazón</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.operacion_amigdalas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, operacion_amigdalas: checked })}
                                                        id="operacion_amigdalas"
                                                    />
                                                    <Label htmlFor="operacion_amigdalas">Operación de amígdalas o adenoides</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.dificultad_masticar}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, dificultad_masticar: checked })}
                                                        id="dificultad_masticar"
                                                    />
                                                    <Label htmlFor="dificultad_masticar">Dificultad para masticar o deglutir</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.ronca_dormir}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, ronca_dormir: checked })}
                                                        id="ronca_dormir"
                                                    />
                                                    <Label htmlFor="ronca_dormir">Ronca al dormir</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.respira_boca}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, respira_boca: checked })}
                                                        id="respira_boca"
                                                    />
                                                    <Label htmlFor="respira_boca">Respira por la boca</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.chupa_dedo}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, chupa_dedo: checked })}
                                                        id="chupa_dedo"
                                                    />
                                                    <Label htmlFor="chupa_dedo">Chupa el dedo</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.muerde_labio}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, muerde_labio: checked })}
                                                        id="muerde_labio"
                                                    />
                                                    <Label htmlFor="muerde_labio">Se muerde el labio</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.muerde_unas}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, muerde_unas: checked })}
                                                        id="muerde_unas"
                                                    />
                                                    <Label htmlFor="muerde_unas">Se muerde las uñas</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.rechina_dientes}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, rechina_dientes: checked })}
                                                        id="rechina_dientes"
                                                    />
                                                    <Label htmlFor="rechina_dientes">Rechina los dientes</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={!!editPatientInfo.enfermedades_transmision_sexual}
                                                        onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, enfermedades_transmision_sexual: checked })}
                                                        id="enfermedades_transmision_sexual"
                                                    />
                                                    <Label htmlFor="enfermedades_transmision_sexual">Enfermedades de transmisión sexual</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "padecimientos"}
                                            onClick={() => updateSectionData("padecimientos", padecimientos)}
                                        >
                                            {savingSection === "padecimientos" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Preguntas */}
                                <AccordionItem value="preguntas">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Preguntas
                                            {loadingSection === "preguntas" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "preguntas" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "preguntas" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.consulta_ortodoncia}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, consulta_ortodoncia: checked })}
                                                    id="consulta_ortodoncia"
                                                />
                                                <Label htmlFor="consulta_ortodoncia">¿Ha tenido alguna vez una consulta de ortodoncia?</Label>
                                            </div>
                                            <div>
                                                <Label htmlFor="cuando_ortodoncia">¿Cuándo?</Label>
                                                <Input
                                                    id="cuando_ortodoncia"
                                                    placeholder="Fecha de la consulta (si la recuerda)"
                                                    value={editPatientInfo.cuando_ortodoncia ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, cuando_ortodoncia: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="porque_ortodoncia">¿Por qué?</Label>
                                                <Input
                                                    id="porque_ortodoncia"
                                                    placeholder="Razón de la consulta"
                                                    value={editPatientInfo.porque_ortodoncia ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, porque_ortodoncia: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="resultado_ortodoncia">¿Cuál fue el resultado?</Label>
                                                <Input
                                                    id="resultado_ortodoncia"
                                                    placeholder="Resultado de la consulta"
                                                    value={editPatientInfo.resultado_ortodoncia ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, resultado_ortodoncia: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.problema_mordida}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, problema_mordida: checked })}
                                                    id="problema_mordida"
                                                />
                                                <Label htmlFor="problema_mordida">¿Ha notado algún problema con la mordida o la posición de los dientes?</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={!!editPatientInfo.comentarios_problema}
                                                    onCheckedChange={checked => setEditPatientInfo({ ...editPatientInfo, comentarios_problema: checked })}
                                                    id="comentarios_problema"
                                                />
                                                <Label htmlFor="comentarios_problema">¿Le han comentado que tenga un problema de este tipo?</Label>
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "preguntas"}
                                            onClick={() => updateSectionData("preguntas", preguntas)}
                                        >
                                            {savingSection === "preguntas" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Interrogatorio */}
                                <AccordionItem value="interrogatorio">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Interrogatorio por Aparatos y Sistemas
                                            {loadingSection === "interrogatorio" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "interrogatorio" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "interrogatorio" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="aparato_digestivo">Aparato Digestivo</Label>
                                                <Input
                                                    id="aparato_digestivo"
                                                    placeholder="Descripción del estado del aparato digestivo"
                                                    value={editPatientInfo.aparato_digestivo ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, aparato_digestivo: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="aparato_cardiovascular">Aparato Cardiovascular</Label>
                                                <Input
                                                    id="aparato_cardiovascular"
                                                    placeholder="Descripción del estado del aparato cardiovascular"
                                                    value={editPatientInfo.aparato_cardiovascular ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, aparato_cardiovascular: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="aparato_respiratorio">Aparato Respiratorio</Label>
                                                <Input
                                                    id="aparato_respiratorio"
                                                    placeholder="Descripción del estado del aparato respiratorio"
                                                    value={editPatientInfo.aparato_respiratorio ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, aparato_respiratorio: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="aparato_genito_urinario">Aparato Genito-Urinario</Label>
                                                <Input
                                                    id="aparato_genito_urinario"
                                                    placeholder="Descripción del estado del aparato genito-urinario"
                                                    value={editPatientInfo.aparato_genito_urinario ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, aparato_genito_urinario: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="sistema_endocrino">Sistema Endocrino</Label>
                                                <Input
                                                    id="sistema_endocrino"
                                                    placeholder="Descripción del estado del sistema endocrino"
                                                    value={editPatientInfo.sistema_endocrino ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, sistema_endocrino: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="sistema_nervioso">Sistema Nervioso</Label>
                                                <Input
                                                    id="sistema_nervioso"
                                                    placeholder="Descripción del estado del sistema nervioso"
                                                    value={editPatientInfo.sistema_nervioso ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, sistema_nervioso: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "interrogatorio"}
                                            onClick={() => updateSectionData("interrogatorio", interrogatorio)}
                                        >
                                            {savingSection === "interrogatorio" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Exploración */}
                                <AccordionItem value="exploracion">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Exploración General
                                            {loadingSection === "exploracion" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "exploracion" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "exploracion" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-6">
                                            {/* Exploración Física */}
                                            <div>
                                                <h5 className="font-semibold">Exploración Física</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <Label htmlFor="exg_presion_arterial">Presión Arterial</Label>
                                                        <Input
                                                            id="exg_presion_arterial"
                                                            value={editPatientInfo.exg_presion_arterial ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_presion_arterial: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_frecuencia_respiratoria">Frecuencia Respiratoria</Label>
                                                        <Input
                                                            id="exg_frecuencia_respiratoria"
                                                            value={editPatientInfo.exg_frecuencia_respiratoria ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_frecuencia_respiratoria: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_pulso">Pulso</Label>
                                                        <Input
                                                            id="exg_pulso"
                                                            value={editPatientInfo.exg_pulso ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_pulso: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_temperatura">Temperatura</Label>
                                                        <Input
                                                            id="exg_temperatura"
                                                            value={editPatientInfo.exg_temperatura ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_temperatura: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_peso_actual">Peso Actual</Label>
                                                        <Input
                                                            id="exg_peso_actual"
                                                            value={editPatientInfo.exg_peso_actual ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_peso_actual: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_talla">Talla</Label>
                                                        <Input
                                                            id="exg_talla"
                                                            value={editPatientInfo.exg_talla ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_talla: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Exploración Regional */}
                                            <div>
                                                <h5 className="font-semibold">Exploración Regional</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="exg_cabeza">Cabeza</Label>
                                                        <Input
                                                            id="exg_cabeza"
                                                            value={editPatientInfo.exg_cabeza ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_cabeza: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_cuello">Cuello</Label>
                                                        <Input
                                                            id="exg_cuello"
                                                            value={editPatientInfo.exg_cuello ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_cuello: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Exploración Oral */}
                                            <div>
                                                <h5 className="font-semibold">Exploración Oral</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="exg_higiene">Higiene</Label>
                                                        <Input
                                                            id="exg_higiene"
                                                            value={editPatientInfo.exg_higiene ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_higiene: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_periodonto">Periodonto</Label>
                                                        <Input
                                                            id="exg_periodonto"
                                                            value={editPatientInfo.exg_periodonto ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_periodonto: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_prevalencia_caries">Prevalencia de Caries</Label>
                                                        <Input
                                                            id="exg_prevalencia_caries"
                                                            value={editPatientInfo.exg_prevalencia_caries ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_prevalencia_caries: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_denticion">Dentición</Label>
                                                        <Input
                                                            id="exg_denticion"
                                                            value={editPatientInfo.exg_denticion ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_denticion: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_dientes_faltantes">Dientes Faltantes</Label>
                                                        <Input
                                                            id="exg_dientes_faltantes"
                                                            value={editPatientInfo.exg_dientes_faltantes ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_dientes_faltantes: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_dientes_retenidos">Dientes Retenidos</Label>
                                                        <Input
                                                            id="exg_dientes_retenidos"
                                                            value={editPatientInfo.exg_dientes_retenidos ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_dientes_retenidos: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_dientes_impactados">Dientes Impactados</Label>
                                                        <Input
                                                            id="exg_dientes_impactados"
                                                            value={editPatientInfo.exg_dientes_impactados ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_dientes_impactados: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_descalcificacion_dientes">Descalcificación de Dientes</Label>
                                                        <Input
                                                            id="exg_descalcificacion_dientes"
                                                            value={editPatientInfo.exg_descalcificacion_dientes ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_descalcificacion_dientes: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_insercion_frenillos">Inserción de Frenillos</Label>
                                                        <Input
                                                            id="exg_insercion_frenillos"
                                                            value={editPatientInfo.exg_insercion_frenillos ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_insercion_frenillos: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_labios">Labios</Label>
                                                        <Input
                                                            id="exg_labios"
                                                            value={editPatientInfo.exg_labios ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_labios: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_proporcion_lengua_arcos">Proporción Lengua-Arcos</Label>
                                                        <Input
                                                            id="exg_proporcion_lengua_arcos"
                                                            value={editPatientInfo.exg_proporcion_lengua_arcos ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_proporcion_lengua_arcos: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_problemas_lenguaje">Problemas de Lenguaje</Label>
                                                        <Input
                                                            id="exg_problemas_lenguaje"
                                                            value={editPatientInfo.exg_problemas_lenguaje ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_problemas_lenguaje: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_terceros_molares">Terceros Molares</Label>
                                                        <Input
                                                            id="exg_terceros_molares"
                                                            value={editPatientInfo.exg_terceros_molares ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_terceros_molares: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_habitos">Hábitos</Label>
                                                        <Input
                                                            id="exg_habitos"
                                                            value={editPatientInfo.exg_habitos ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_habitos: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_tipo_perfil">Tipo de Perfil</Label>
                                                        <Input
                                                            id="exg_tipo_perfil"
                                                            value={editPatientInfo.exg_tipo_perfil ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_tipo_perfil: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_tipo_craneo">Tipo de Cráneo</Label>
                                                        <Input
                                                            id="exg_tipo_craneo"
                                                            value={editPatientInfo.exg_tipo_craneo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_tipo_craneo: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_tipo_cara">Tipo de Cara</Label>
                                                        <Input
                                                            id="exg_tipo_cara"
                                                            value={editPatientInfo.exg_tipo_cara ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_tipo_cara: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_forma_arcadas_dentarias">Forma de las Arcadas Dentarias</Label>
                                                        <Input
                                                            id="exg_forma_arcadas_dentarias"
                                                            value={editPatientInfo.exg_forma_arcadas_dentarias ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_forma_arcadas_dentarias: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                    <div>
                                                        <Label htmlFor="exg_forma_paladar">Forma del Paladar</Label>
                                                        <Input
                                                            id="exg_forma_paladar"
                                                            value={editPatientInfo.exg_forma_paladar ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_forma_paladar: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="exg_observaciones_especiales">Observaciones Especiales</Label>
                                                        <Input
                                                            id="exg_observaciones_especiales"
                                                            value={editPatientInfo.exg_observaciones_especiales ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exg_observaciones_especiales: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "exploracion"}
                                            onClick={() => updateSectionData("exploracion", {
                                                exg_presion_arterial: editPatientInfo.exg_presion_arterial,
                                                exg_frecuencia_respiratoria: editPatientInfo.exg_frecuencia_respiratoria,
                                                exg_pulso: editPatientInfo.exg_pulso,
                                                exg_temperatura: editPatientInfo.exg_temperatura,
                                                exg_peso_actual: editPatientInfo.exg_peso_actual,
                                                exg_talla: editPatientInfo.exg_talla,
                                                exg_cabeza: editPatientInfo.exg_cabeza,
                                                exg_cuello: editPatientInfo.exg_cuello,
                                                exg_higiene: editPatientInfo.exg_higiene,
                                                exg_periodonto: editPatientInfo.exg_periodonto,
                                                exg_prevalencia_caries: editPatientInfo.exg_prevalencia_caries,
                                                exg_denticion: editPatientInfo.exg_denticion,
                                                exg_dientes_faltantes: editPatientInfo.exg_dientes_faltantes,
                                                exg_dientes_retenidos: editPatientInfo.exg_dientes_retenidos,
                                                exg_dientes_impactados: editPatientInfo.exg_dientes_impactados,
                                                exg_descalcificacion_dientes: editPatientInfo.exg_descalcificacion_dientes,
                                                exg_insercion_frenillos: editPatientInfo.exg_insercion_frenillos,
                                                exg_labios: editPatientInfo.exg_labios,
                                                exg_proporcion_lengua_arcos: editPatientInfo.exg_proporcion_lengua_arcos,
                                                exg_problemas_lenguaje: editPatientInfo.exg_problemas_lenguaje,
                                                exg_terceros_molares: editPatientInfo.exg_terceros_molares,
                                                exg_habitos: editPatientInfo.exg_habitos,
                                                exg_tipo_perfil: editPatientInfo.exg_tipo_perfil,
                                                exg_tipo_craneo: editPatientInfo.exg_tipo_craneo,
                                                exg_tipo_cara: editPatientInfo.exg_tipo_cara,
                                                exg_forma_arcadas_dentarias: editPatientInfo.exg_forma_arcadas_dentarias,
                                                exg_forma_paladar: editPatientInfo.exg_forma_paladar,
                                                exg_observaciones_especiales: editPatientInfo.exg_observaciones_especiales
                                            })}
                                        >
                                            {savingSection === "exploracion" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Exámenes */}
                                <AccordionItem value="examenes">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Exámenes
                                            {loadingSection === "examenes" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "examenes" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "examenes" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="exm_tipo_denticion">Tipo de Dentición</Label>
                                                <Input
                                                    id="exm_tipo_denticion"
                                                    value={editPatientInfo.exm_tipo_denticion ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_tipo_denticion: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <h5 className="font-semibold">1. Relación molar 6/6</h5>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label>Clase</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_molar_clase ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_molar_clase: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Derecho (mm)</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_molar_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_molar_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Izquierdo (mm)</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_molar_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_molar_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold">2. Relación canina 3/3</h5>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label>Clase</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_canina_clase ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_canina_clase: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Derecho (mm)</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_canina_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_canina_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Izquierdo (mm)</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_relacion_canina_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_relacion_canina_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold">3. Plano terminal</h5>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label>Recto Derecho</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_recto_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_recto_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Recto Izquierdo</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_recto_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_recto_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <Label>Escalón mesial Derecho</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_mesial_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_mesial_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Escalón mesial Izquierdo</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_mesial_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_mesial_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <Label>Escalón distal Derecho</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_distal_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_distal_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Escalón distal Izquierdo</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_distal_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_distal_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <Label>Escalón mesian exagerado Derecho</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_mesian_exagerado_derecho ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_mesian_exagerado_derecho: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Escalón mesian exagerado Izquierdo</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_plano_terminal_mesian_exagerado_izquierdo ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_plano_terminal_mesian_exagerado_izquierdo: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold">4. Espaciada / Cerrada</h5>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label>Espaciada Arco Maxilar</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_espaciada_arco_maxilar ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_espaciada_arco_maxilar: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Espaciada Arco Mandibular</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_espaciada_arco_mandibular ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_espaciada_arco_mandibular: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-2">
                                                    <div>
                                                        <Label>Cerrada Arco Maxilar</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_cerrada_arco_maxilar ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_cerrada_arco_maxilar: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Cerrada Arco Mandibular</Label>
                                                        <Input
                                                            value={editPatientInfo.exm_cerrada_arco_mandibular ?? ""}
                                                            onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_cerrada_arco_mandibular: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_clasificacion_angle">Clasificación de Angle</Label>
                                                    <Input
                                                        id="exm_clasificacion_angle"
                                                        value={editPatientInfo.exm_clasificacion_angle ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_clasificacion_angle: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exm_mordida_cruzada">Mordida cruzada en</Label>
                                                    <Input
                                                        id="exm_mordida_cruzada"
                                                        value={editPatientInfo.exm_mordida_cruzada ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_mordida_cruzada: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_linea_media_dentaria_mandibular">Línea media dentaria mandibular con relación a superior</Label>
                                                    <Input
                                                        id="exm_linea_media_dentaria_mandibular"
                                                        value={editPatientInfo.exm_linea_media_dentaria_mandibular ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_linea_media_dentaria_mandibular: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exm_linea_media_dentaria_maxilar">Línea media dentaria maxilar en relación a facial</Label>
                                                    <Input
                                                        id="exm_linea_media_dentaria_maxilar"
                                                        value={editPatientInfo.exm_linea_media_dentaria_maxilar ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_linea_media_dentaria_maxilar: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_rotaciones">Rotaciones en</Label>
                                                    <Input
                                                        id="exm_rotaciones"
                                                        value={editPatientInfo.exm_rotaciones ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_rotaciones: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exm_apianamiento">Apiñamiento en mm</Label>
                                                    <Input
                                                        id="exm_apianamiento"
                                                        value={editPatientInfo.exm_apianamiento ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_apianamiento: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_espacios">Espacios en mm</Label>
                                                    <Input
                                                        id="exm_espacios"
                                                        value={editPatientInfo.exm_espacios ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_espacios: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exm_over_jet">Over jet</Label>
                                                    <Input
                                                        id="exm_over_jet"
                                                        value={editPatientInfo.exm_over_jet ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_over_jet: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_over_bite">Over bite</Label>
                                                    <Input
                                                        id="exm_over_bite"
                                                        value={editPatientInfo.exm_over_bite ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_over_bite: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exm_sintomatologia_atm">Sintomatología de la ATM</Label>
                                                    <Input
                                                        id="exm_sintomatologia_atm"
                                                        value={editPatientInfo.exm_sintomatologia_atm ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_sintomatologia_atm: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <Label htmlFor="exm_interferencias_oclusales">Interferencias oclusales en</Label>
                                                    <Input
                                                        id="exm_interferencias_oclusales"
                                                        value={editPatientInfo.exm_interferencias_oclusales ?? ""}
                                                        onChange={e => setEditPatientInfo({ ...editPatientInfo, exm_interferencias_oclusales: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "examenes"}
                                            onClick={() => updateSectionData("examenes", examenes)}
                                        >
                                            {savingSection === "examenes" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* Diagnóstico */}
                                <AccordionItem value="diagnostico">
                                    <AccordionTrigger>
                                        <h3 className="text-xl font-semibold text-primary w-full text-left transition-colors duration-200 hover:text-gray-400 focus:text-gray-400 flex items-center gap-2">
                                            Diagnóstico
                                            {loadingSection === "diagnostico" && (
                                                <span className="animate-pulse text-gray-400 text-base ml-2">Cargando sección...</span>
                                            )}
                                        </h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {loadingSection === "diagnostico" && <LoadingSpinner size="md" className="my-4" />}
                                        {errorSection === "diagnostico" && <div className="text-red-500">Error al cargar datos</div>}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="diag_examenes_laboratorio">Exámenes de Laboratorio (anexados al final)</Label>
                                                <textarea
                                                    id="diag_examenes_laboratorio"
                                                    rows={3}
                                                    className="form-control w-full rounded border px-3 py-2"
                                                    value={editPatientInfo.diag_examenes_laboratorio ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, diag_examenes_laboratorio: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="diag_estudios_gabinete">Estudios de Gabinete (anexados al final)</Label>
                                                <textarea
                                                    id="diag_estudios_gabinete"
                                                    rows={3}
                                                    className="form-control w-full rounded border px-3 py-2"
                                                    value={editPatientInfo.diag_estudios_gabinete ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, diag_estudios_gabinete: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="diag_diagnostico">Diagnóstico</Label>
                                                <textarea
                                                    id="diag_diagnostico"
                                                    rows={3}
                                                    className="form-control w-full rounded border px-3 py-2"
                                                    value={editPatientInfo.diag_diagnostico ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, diag_diagnostico: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="diag_pronostico">Pronóstico</Label>
                                                <textarea
                                                    id="diag_pronostico"
                                                    rows={3}
                                                    className="form-control w-full rounded border px-3 py-2"
                                                    value={editPatientInfo.diag_pronostico ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, diag_pronostico: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="diag_plan_tratamiento">Plan de Tratamiento</Label>
                                                <textarea
                                                    id="diag_plan_tratamiento"
                                                    rows={3}
                                                    className="form-control w-full rounded border px-3 py-2"
                                                    value={editPatientInfo.diag_plan_tratamiento ?? ""}
                                                    onChange={e => setEditPatientInfo({ ...editPatientInfo, diag_plan_tratamiento: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                                            disabled={savingSection === "diagnostico"}
                                            onClick={() => updateSectionData("diagnostico", diagnostico)}
                                        >
                                            {savingSection === "diagnostico" ? "Guardando..." : "Guardar sección"}
                                        </button>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* Agregar términos y condiciones aquí, justo después de Observaciones especiales */}
                            <div className="mt-6 text-center">
                                <Button
                                    variant="link"
                                    className="text-primary underline"
                                    onClick={() => setShowTermsDialog(true)}
                                >
                                    Leer carta de consentimiento informado
                                </Button>
                            </div>

                        </div>
                    </ScrollArea>
                    <DialogFooter className="px-6 py-4 border-t flex justify-end gap-4">
                        <button
                            className="mt-4 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
                            onClick={onOpenChange?.bind(null, false)}
                        >
                            Salir
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="section-title">Términos y Condiciones</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm">
                            Certifico que toda la información proporcionada es correcta y que es mi responsabilidad informar sobre
                            cualquier cambio sobre mi salud. He sido informado acerca del diagnóstico y plan de tratamiento que
                            recibiré en la clínica de rehabilitación oral. Campus Xalapa, y reconozco las complicaciones que se puedan
                            presentar dichos procedimientos, por lo que no tengo dudas al respecto y autorizo al odontólogo tratante y
                            de esta forma para que efectúe los tratamientos que sean necesarios para el alivio y/o curar de los
                            padecimientos desde ahora y hasta el final de mi tratamiento.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowTermsDialog(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
