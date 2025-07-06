import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { NoPatogenos } from "@/types/no_patogenos";

// GET: Obtener antecedentes no patológicos de un paciente
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed03_no_patogenos WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [NoPatogenos[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// POST: Crear antecedentes no patológicos
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            cepillo,
            habitacion,
            tabaquismo,
            alcoholismo,
            alimentacion,
            inmunizaciones,
            pasatiempos,
            vida_sexual
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed03_no_patogenos (
                id_paciente, cepillo, habitacion, tabaquismo, alcoholismo,
                alimentacion, inmunizaciones, pasatiempos, vida_sexual
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                cepillo ?? null,
                habitacion ?? null,
                tabaquismo ?? null,
                alcoholismo ?? null,
                alimentacion ?? null,
                inmunizaciones ?? null,
                pasatiempos ?? null,
                vida_sexual ?? null
            ]
        );
        return NextResponse.json({ success: true, id: result.insertId || null });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PUT: Actualizar antecedentes no patológicos
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
            "SELECT id_paciente FROM hismed03_no_patogenos WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [NoPatogenos[], FieldPacket[]];
        if (!existRows || existRows.length === 0) {
            // Si no existe, hacer un INSERT (upsert)
            await db.query(
                `INSERT INTO hismed03_no_patogenos (id_paciente, ${filteredKeys.join(", ")}) VALUES (?, ${filteredKeys.map(_=>"?").join(", ")})`,
                [Number(id_paciente), ...filteredValues]
            );
            return NextResponse.json({ success: true, upserted: true });
        }
        // Si existe, hacer UPDATE
        const updates = filteredKeys.map((key) => `${key} = ?`).join(", ");
        await db.query(
            `UPDATE hismed03_no_patogenos SET ${updates} WHERE id_paciente = ?`,
            [...filteredValues, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE: Eliminar antecedentes no patológicos
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    // Validar existencia antes de eliminar
    const [existRows] = await db.query(
        "SELECT id_paciente FROM hismed03_no_patogenos WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [NoPatogenos[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed03_no_patogenos WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}