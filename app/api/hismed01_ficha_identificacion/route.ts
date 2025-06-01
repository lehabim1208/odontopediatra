import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";

// Obtener ficha de identificación de un paciente
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente) {
        return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
    }
    const [rows]: [Array<Record<string, any>>, any] = await db.query(
        "SELECT * FROM hismed01_ficha_identificacion WHERE id_paciente = ?",
        [Number(id_paciente)]
    );
    return NextResponse.json({ data: rows[0] || null });
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
        const body = await request.json();
        const { id_paciente, ...fields } = body;
        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }
        const updates = Object.keys(fields)
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(fields);

        await db.query(
            `UPDATE hismed01_ficha_identificacion SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al actualizar ficha de identificación:", error, "route.ts");
        return NextResponse.json({ error: "Error al actualizar ficha de identificación" }, { status: 500 });
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