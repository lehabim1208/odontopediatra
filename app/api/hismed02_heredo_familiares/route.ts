import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { HeredoFamiliares } from "@/types/heredo_familiares";

// Obtener antecedentes heredo-familiares de un paciente
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed02_heredo_familiares WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [HeredoFamiliares[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// Crear antecedentes heredo-familiares
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            abuelo_paterno,
            abuela_paterna,
            abuelo_materno,
            abuela_materna,
            madre,
            padre,
            otros_familiares,
            no_sabe,
            tuberculosis,
            diabetes,
            hipertension,
            carcinomas,
            cardiopatias,
            hepatitis,
            nefropatias,
            endocrinas,
            mentales,
            epilepsia,
            asma,
            hematologicas,
            sifilis
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed02_heredo_familiares (
                id_paciente, abuelo_paterno, abuela_paterna, abuelo_materno, abuela_materna,
                madre, padre, otros_familiares, no_sabe, tuberculosis, diabetes, hipertension,
                carcinomas, cardiopatias, hepatitis, nefropatias, endocrinas, mentales, epilepsia,
                asma, hematologicas, sifilis
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                abuelo_paterno ?? null,
                abuela_paterna ?? null,
                abuelo_materno ?? null,
                abuela_materna ?? null,
                madre ?? null,
                padre ?? null,
                otros_familiares ?? null,
                no_sabe ?? null,
                tuberculosis ?? null,
                diabetes ?? null,
                hipertension ?? null,
                carcinomas ?? null,
                cardiopatias ?? null,
                hepatitis ?? null,
                nefropatias ?? null,
                endocrinas ?? null,
                mentales ?? null,
                epilepsia ?? null,
                asma ?? null,
                hematologicas ?? null,
                sifilis ?? null
            ]
        );
        return NextResponse.json({ success: true, id: result.insertId || null });
    } catch (error) {
        console.error("Error al crear antecedentes heredo-familiares:", error, "route.ts");
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// Actualizar antecedentes heredo-familiares de un paciente
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id_paciente, ...fields } = body;
        if (!id_paciente || isNaN(Number(id_paciente))) {
            return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
        }
        // Validar existencia antes de actualizar
        const [existRows] = await db.query(
            "SELECT id_paciente FROM hismed02_heredo_familiares WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [HeredoFamiliares[], FieldPacket[]];
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
            `UPDATE hismed02_heredo_familiares SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al actualizar antecedentes heredo-familiares:", error, "route.ts");
        return NextResponse.json({ error: "Error al actualizar antecedentes heredo-familiares" }, { status: 500 });
    }
}

// Eliminar antecedentes heredo-familiares de un paciente
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    // Validar existencia antes de eliminar
    const [existRows] = await db.query(
        "SELECT id_paciente FROM hismed02_heredo_familiares WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [HeredoFamiliares[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed02_heredo_familiares WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}