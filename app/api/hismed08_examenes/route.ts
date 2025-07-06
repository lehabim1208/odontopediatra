import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { Examenes } from "@/types/examenes";

// GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed08_examenes WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Examenes[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// POST
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            exm_tipo_denticion,
            exm_relacion_molar_clase,
            exm_relacion_molar_derecho,
            exm_relacion_molar_izquierdo,
            exm_relacion_canina_clase,
            exm_relacion_canina_derecho,
            exm_relacion_canina_izquierdo,
            exm_plano_terminal_recto_derecho,
            exm_plano_terminal_recto_izquierdo,
            exm_plano_terminal_mesial_derecho,
            exm_plano_terminal_mesial_izquierdo,
            exm_plano_terminal_distal_derecho,
            exm_plano_terminal_distal_izquierdo,
            exm_plano_terminal_mesian_exagerado_derecho,
            exm_plano_terminal_mesian_exagerado_izquierdo
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed08_examenes (
                id_paciente, exm_tipo_denticion, exm_relacion_molar_clase, exm_relacion_molar_derecho, exm_relacion_molar_izquierdo,
                exm_relacion_canina_clase, exm_relacion_canina_derecho, exm_relacion_canina_izquierdo,
                exm_plano_terminal_recto_derecho, exm_plano_terminal_recto_izquierdo,
                exm_plano_terminal_mesial_derecho, exm_plano_terminal_mesial_izquierdo,
                exm_plano_terminal_distal_derecho, exm_plano_terminal_distal_izquierdo,
                exm_plano_terminal_mesian_exagerado_derecho, exm_plano_terminal_mesian_exagerado_izquierdo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                exm_tipo_denticion ?? null,
                exm_relacion_molar_clase ?? null,
                exm_relacion_molar_derecho ?? null,
                exm_relacion_molar_izquierdo ?? null,
                exm_relacion_canina_clase ?? null,
                exm_relacion_canina_derecho ?? null,
                exm_relacion_canina_izquierdo ?? null,
                exm_plano_terminal_recto_derecho ?? null,
                exm_plano_terminal_recto_izquierdo ?? null,
                exm_plano_terminal_mesial_derecho ?? null,
                exm_plano_terminal_mesial_izquierdo ?? null,
                exm_plano_terminal_distal_derecho ?? null,
                exm_plano_terminal_distal_izquierdo ?? null,
                exm_plano_terminal_mesian_exagerado_derecho ?? null,
                exm_plano_terminal_mesian_exagerado_izquierdo ?? null
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
        // Filtrar campos undefined/null
        const filteredEntries = Object.entries(fields).filter(
            ([, value]) => value !== undefined && value !== null
        );
        if (filteredEntries.length === 0) {
            return NextResponse.json({ error: "No hay campos para actualizar/insertar" }, { status: 400 });
        }
        const filteredKeys = filteredEntries.map(([key]) => key);
        const filteredValues = filteredEntries.map(([, value]) => value);
        // Validar existencia antes de actualizar
        const [existRows] = await db.query(
            "SELECT id_paciente FROM hismed08_examenes WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [Examenes[], FieldPacket[]];
        if (!existRows || existRows.length === 0) {
            // Si no existe, hacer un INSERT (upsert)
            await db.query(
                `INSERT INTO hismed08_examenes (id_paciente, ${filteredKeys.join(", ")}) VALUES (?, ${filteredKeys.map(_=>"?").join(", ")})`,
                [Number(id_paciente), ...filteredValues]
            );
            return NextResponse.json({ success: true, upserted: true });
        }
        // Si existe, hacer UPDATE
        const updates = filteredKeys.map((key) => `${key} = ?`).join(", ");
        await db.query(
            `UPDATE hismed08_examenes SET ${updates} WHERE id_paciente = ?`,
            [...filteredValues, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
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
        "SELECT id_paciente FROM hismed08_examenes WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Examenes[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed08_examenes WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}