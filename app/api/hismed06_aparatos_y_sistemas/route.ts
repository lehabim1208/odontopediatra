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
        "SELECT * FROM hismed06_aparatos_y_sistemas WHERE id_paciente = ?",
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
            aparato_digestivo,
            aparato_cardiovascular,
            aparato_respiratorio,
            aparato_genito_urinario,
            sistema_endocrino,
            sistema_nervioso
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed06_aparatos_y_sistemas (
                id_paciente, aparato_digestivo, aparato_cardiovascular, aparato_respiratorio,
                aparato_genito_urinario, sistema_endocrino, sistema_nervioso
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                aparato_digestivo ?? null,
                aparato_cardiovascular ?? null,
                aparato_respiratorio ?? null,
                aparato_genito_urinario ?? null,
                sistema_endocrino ?? null,
                sistema_nervioso ?? null
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
            `UPDATE hismed06_aparatos_y_sistemas SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar aparatos y sistemas" }, { status: 500 });
    }
}

// DELETE
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente) {
        return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
    }
    await db.query("DELETE FROM hismed06_aparatos_y_sistemas WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}