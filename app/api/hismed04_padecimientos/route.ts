import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { Padecimientos } from "@/types/padecimientos";

// GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed04_padecimientos WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Padecimientos[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// POST
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            accidentes_cara,
            operaciones_cara,
            alergias,
            problemas_oido,
            problemas_nacimiento,
            problemas_sangrado,
            problemas_lenguaje,
            problemas_respiracion,
            padecimiento_asma,
            anemia,
            problemas_amigdalas,
            padecimiento_diabetes,
            padecimiento_epilepsia,
            fiebre_reumatica,
            enfermedades_corazon,
            operacion_amigdalas,
            dificultad_masticar,
            ronca_dormir,
            respira_boca,
            chupa_dedo,
            muerde_labio,
            muerde_unas,
            rechina_dientes,
            enfermedades_transmision_sexual
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed04_padecimientos (
                id_paciente, accidentes_cara, operaciones_cara, alergias, problemas_oido, problemas_nacimiento,
                problemas_sangrado, problemas_lenguaje, problemas_respiracion, padecimiento_asma, anemia, problemas_amigdalas,
                padecimiento_diabetes, padecimiento_epilepsia, fiebre_reumatica, enfermedades_corazon, operacion_amigdalas,
                dificultad_masticar, ronca_dormir, respira_boca, chupa_dedo, muerde_labio, muerde_unas, rechina_dientes,
                enfermedades_transmision_sexual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                accidentes_cara ?? null,
                operaciones_cara ?? null,
                alergias ?? null,
                problemas_oido ?? null,
                problemas_nacimiento ?? null,
                problemas_sangrado ?? null,
                problemas_lenguaje ?? null,
                problemas_respiracion ?? null,
                padecimiento_asma ?? null,
                anemia ?? null,
                problemas_amigdalas ?? null,
                padecimiento_diabetes ?? null,
                padecimiento_epilepsia ?? null,
                fiebre_reumatica ?? null,
                enfermedades_corazon ?? null,
                operacion_amigdalas ?? null,
                dificultad_masticar ?? null,
                ronca_dormir ?? null,
                respira_boca ?? null,
                chupa_dedo ?? null,
                muerde_labio ?? null,
                muerde_unas ?? null,
                rechina_dientes ?? null,
                enfermedades_transmision_sexual ?? null
            ]
        );
        return NextResponse.json({ success: true, id: result.insertId || null });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PUT
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id_paciente, ...fields } = body;
        if (!id_paciente || isNaN(Number(id_paciente))) {
            return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
        }
        // Validar existencia antes de actualizar
        const [existRows] = await db.query(
            "SELECT id_paciente FROM hismed04_padecimientos WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [Padecimientos[], FieldPacket[]];
        if (!existRows || existRows.length === 0) {
            return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
        }
        const updateKeys = Object.keys(fields);
        if (updateKeys.length === 0) {
            return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
        }
        const updates = updateKeys.map((key) => `${key} = ?`).join(", ");
        const values = Object.values(fields);
        await db.query(
            `UPDATE hismed04_padecimientos SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar padecimientos" }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    // Validar existencia antes de eliminar
    const [existRows] = await db.query(
        "SELECT id_paciente FROM hismed04_padecimientos WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Padecimientos[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed04_padecimientos WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}