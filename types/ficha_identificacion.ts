export interface FichaIdentificacion {
    id_paciente: number;                // int
    nombre: string | null;              // varchar(255)
    edad: number | null;                // int
    sexo: string | null;                // varchar(50)
    nacionalidad: string | null;        // varchar(100)
    estado_civil: string | null;        // varchar(50)
    ocupacion: string | null;           // varchar(100)
    medico: string | null;              // varchar(255)
    telefono: string | null;            // varchar(20)
    lugar_origen: string | null;        // varchar(255)
    lugar_residencia: string | null;    // varchar(255)
    fecha_nacimiento: string | null;    // date (usar string en formato 'YYYY-MM-DD')
    domicilio: string | null;           // varchar(255)
    region: string | null;              // varchar(100)
    correo: string | null;              // varchar(255)
    emergencia: string | null;          // varchar(255)
    talla_peso_nacimiento: string | null; // varchar(100)
    tipo_parto: string | null;          // varchar(100)
    padre_tutor: string | null;         // varchar(255)
    ultimo_examen_dental: string | null; // date (usar string en formato 'YYYY-MM-DD')
    motivo_consulta: string | null;     // varchar(255)
    interes_tratamiento: string | null; // varchar(255)
}