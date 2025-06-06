import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { Preguntas } from "@/types/preguntas";

// GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed05_preguntas WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Preguntas[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// POST
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            consulta_ortodoncia,
            cuando_ortodoncia,
            porque_ortodoncia,
            resultado_ortodoncia,
            problema_mordida,
            comentarios_problema
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed05_preguntas (
                id_paciente, consulta_ortodoncia, cuando_ortodoncia, porque_ortodoncia, resultado_ortodoncia,
                problema_mordida, comentarios_problema
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                consulta_ortodoncia ?? null,
                cuando_ortodoncia ?? null,
                porque_ortodoncia ?? null,
                resultado_ortodoncia ?? null,
                problema_mordida ?? null,
                comentarios_problema ?? null
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
            "SELECT id_paciente FROM hismed05_preguntas WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [Preguntas[], FieldPacket[]];
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
            `UPDATE hismed05_preguntas SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar preguntas" }, { status: 500 });
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
        "SELECT id_paciente FROM hismed05_preguntas WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [Preguntas[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed05_preguntas WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}