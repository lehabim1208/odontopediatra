import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";

// GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente) {
        return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
    }
    const [rows]: [Array<Record<string, any>>, any] = await db.query(
        "SELECT * FROM hismed08_examenes WHERE id_paciente = ?",
        [Number(id_paciente)]
    );
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
        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }
        const updates = Object.keys(fields)
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(fields);

        await db.query(
            `UPDATE hismed08_examenes SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar exámenes" }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente) {
        return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
    }
    await db.query("DELETE FROM hismed08_examenes WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}