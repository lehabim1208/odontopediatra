import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { FichaIdentificacion } from "@/types/ficha_identificacion";

// Obtener ficha de identificación de un paciente
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const idPaciente = searchParams.get("id_paciente");
    if (!idPaciente || isNaN(Number(idPaciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    // 1. Buscar en hismed01_ficha_identificacion
    const [rows] = await db.query(
        "SELECT * FROM hismed01_ficha_identificacion WHERE id_paciente = ?",
        [Number(idPaciente)]
    ) as [FichaIdentificacion[], FieldPacket[]];
    if (rows.length > 0) {
        return NextResponse.json({ data: rows[0] });
    }
    // 2. Si no hay registro, buscar en pacientes
    const [pacRows] = await db.query(
        "SELECT nombre, edad, telefono, correo, nombre_tutor FROM pacientes WHERE id = ?",
        [Number(idPaciente)]
    ) as [Record<string, any>[], FieldPacket[]];
    if (!pacRows || pacRows.length === 0) {
        return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }
    const paciente = pacRows[0];
    // 3. Insertar en hismed01_ficha_identificacion
    const [insertResult] = await db.query(
        `INSERT INTO hismed01_ficha_identificacion (id_paciente, nombre, edad, telefono, correo, padre_tutor)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            Number(idPaciente),
            paciente.nombre ?? null,
            paciente.edad !== undefined && paciente.edad !== null ? Number(paciente.edad) : null,
            paciente.telefono ?? null,
            paciente.correo ?? null,
            paciente.nombre_tutor ?? null
        ]
    ) as [QueryResult, FieldPacket[]];
    // 4. Devuelve los datos insertados
    return NextResponse.json({
        data: {
            id_paciente: Number(idPaciente),
            nombre: paciente.nombre ?? null,
            edad: paciente.edad !== undefined && paciente.edad !== null ? Number(paciente.edad) : null,
            telefono: paciente.telefono ?? null,
            correo: paciente.correo ?? null,
            padre_tutor: paciente.nombre_tutor ?? null
        } as FichaIdentificacion
    });
}

// Crear una nueva ficha de identificación
export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Body recibido:", body);  // Verifica la estructura del objeto recibido
        const {
            id_paciente,
            nombre,
            edad,
            sexo,
            nacionalidad,
            estado_civil,
            ocupacion,
            medico,
            telefono,
            lugar_origen,
            lugar_residencia,
            fecha_nacimiento,
            domicilio,
            region,
            correo,
            emergencia,
            talla_peso_nacimiento,
            tipo_parto,
            padre_tutor,
            ultimo_examen_dental,
            motivo_consulta,
            interes_tratamiento
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            // Debe haber 22 signos de interrogación
            `INSERT INTO hismed01_ficha_identificacion (
                id_paciente, nombre, edad, sexo, nacionalidad, estado_civil, ocupacion, medico, telefono,
                lugar_origen, lugar_residencia, fecha_nacimiento, domicilio, region, correo, emergencia,
                talla_peso_nacimiento, tipo_parto, padre_tutor, ultimo_examen_dental, motivo_consulta, interes_tratamiento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                nombre ?? null,
                edad !== undefined && edad !== null ? Number(edad) : null,
                sexo ?? null,
                nacionalidad ?? null,
                estado_civil ?? null,
                ocupacion ?? null,
                medico ?? null,
                telefono ?? null,
                lugar_origen ?? null,
                lugar_residencia ?? null,
                fecha_nacimiento ?? null,
                domicilio ?? null,
                region ?? null,
                correo ?? null,
                emergencia ?? null,
                talla_peso_nacimiento ?? null,
                tipo_parto ?? null,
                padre_tutor ?? null,
                ultimo_examen_dental ?? null,
                motivo_consulta ?? null,
                interes_tratamiento ?? null
            ]
        );
        console.log("Resultado del insert:", result);
        return NextResponse.json({ success: true, id: result.insertId || null });
    } catch (error) {
        console.error("Error al crear ficha de identificación:", error, "route.ts");
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// Actualizar ficha de identificación de un paciente
export async function PUT(request: Request) {
    try {
        const putBody = await request.json();
        const { id_paciente, nombre, edad, telefono, correo, padre_tutor, ...fields } = putBody;
        if (!id_paciente || isNaN(Number(id_paciente))) {
            return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
        }
        // Validar existencia antes de actualizar
        const [existRows] = await db.query(
            "SELECT id_paciente FROM hismed01_ficha_identificacion WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [FichaIdentificacion[], FieldPacket[]];
        if (!existRows || existRows.length === 0) {
            return NextResponse.json({ error: "Ficha de identificación no encontrada" }, { status: 404 });
        }
        // Actualiza la ficha de identificación
        const updateKeys = Object.keys(fields);
        if (updateKeys.length > 0) {
            const updates = updateKeys.map((key) => `${key} = ?`).join(", ");
            const values = Object.values(fields);
            await db.query(
                `UPDATE hismed01_ficha_identificacion SET ${updates} WHERE id_paciente = ?`,
                [...values, Number(id_paciente)]
            );
        }
        // Si se actualizan los datos básicos, actualiza también la tabla pacientes
        if (nombre || edad || telefono || correo || padre_tutor) {
            await db.query(
                `UPDATE pacientes SET
                    nombre = COALESCE(?, nombre),
                    edad = COALESCE(?, edad),
                    telefono = COALESCE(?, telefono),
                    correo = COALESCE(?, correo),
                    nombre_tutor = COALESCE(?, nombre_tutor)
                 WHERE id = ?`,
                [
                    nombre ?? null,
                    edad !== undefined && edad !== null ? Number(edad) : null,
                    telefono ?? null,
                    correo ?? null,
                    padre_tutor ?? null,
                    Number(id_paciente)
                ]
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al actualizar ficha de identificación:", error, "route.ts");
        return NextResponse.json({ error: "Error al actualizar ficha de identificación" }, { status: 500 });
    }
}

// Actualización parcial de ficha de identificación (solo campos modificados)
export async function PATCH(request: Request) {
    try {
        const patchBody = await request.json();
        const { id_paciente, ...fields } = patchBody;
        if (!id_paciente || isNaN(Number(id_paciente))) {
            return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
        }
        // Validar existencia antes de actualizar
        const [existRows] = await db.query(
            "SELECT id_paciente FROM hismed01_ficha_identificacion WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [FichaIdentificacion[], FieldPacket[]];
        if (!existRows || existRows.length === 0) {
            return NextResponse.json({ error: "Ficha de identificación no encontrada" }, { status: 404 });
        }
        // Actualiza solo los campos enviados en hismed01_ficha_identificacion
        const fichaKeys = Object.keys(fields).filter(key => [
            "nombre", "edad", "telefono", "correo", "padre_tutor", "sexo", "nacionalidad", "estado_civil", "ocupacion", "medico", "lugar_origen", "lugar_residencia", "fecha_nacimiento", "domicilio", "region", "emergencia", "talla_peso_nacimiento", "tipo_parto", "ultimo_examen_dental", "motivo_consulta", "interes_tratamiento"
        ].includes(key));
        if (fichaKeys.length > 0) {
            const updates = fichaKeys.map((key) => `${key} = ?`).join(", ");
            const values = fichaKeys.map((key) => fields[key]);
            await db.query(
                `UPDATE hismed01_ficha_identificacion SET ${updates} WHERE id_paciente = ?`,
                [...values, Number(id_paciente)]
            );
        }
        // Si alguno de los datos básicos fue enviado, actualiza también pacientes
        const pacientesMap: Record<string, string> = {
            nombre: "nombre",
            edad: "edad",
            telefono: "telefono",
            correo: "correo",
            padre_tutor: "nombre_tutor"
        };
        const pacientesKeys = Object.keys(fields).filter(key => Object.keys(pacientesMap).includes(key));
        if (pacientesKeys.length > 0) {
            const updates = pacientesKeys.map((key) => `${pacientesMap[key]} = ?`).join(", ");
            const values = pacientesKeys.map((key) => fields[key]);
            await db.query(
                `UPDATE pacientes SET ${updates} WHERE id = ?`,
                [...values, Number(id_paciente)]
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al hacer PATCH de ficha de identificación:", error, "route.ts");
        return NextResponse.json({ error: "Error al actualizar parcialmente la ficha de identificación" }, { status: 500 });
    }
}

// Eliminar ficha de identificación de un paciente
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente) {
        return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
    }
    await db.query("DELETE FROM hismed01_ficha_identificacion WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}