import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader as QueryResult, FieldPacket } from "mysql2";
import { ExploracionGeneral } from "@/types/exploracion_general";

// GET
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id_paciente = searchParams.get("id_paciente");
    if (!id_paciente || isNaN(Number(id_paciente))) {
        return NextResponse.json({ error: "Falta o id_paciente inválido" }, { status: 400 });
    }
    const [rows] = await db.query(
        "SELECT * FROM hismed07_exploracion_general WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [ExploracionGeneral[], FieldPacket[]];
    return NextResponse.json({ data: rows[0] || null });
}

// POST
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            id_paciente,
            exg_presion_arterial,
            exg_frecuencia_respiratoria,
            exg_pulso,
            exg_temperatura,
            exg_peso_actual,
            exg_talla,
            exg_cabeza,
            exg_cuello,
            exg_higiene,
            exg_periodonto,
            exg_prevalencia_caries,
            exg_denticion,
            exg_dientes_faltantes,
            exg_dientes_retenidos,
            exg_dientes_impactados,
            exg_descalcificacion_dientes,
            exg_insercion_frenillos,
            exg_labios,
            exg_proporcion_lengua_arcos,
            exg_problemas_lenguaje,
            exg_terceros_molares,
            exg_habitos,
            exg_tipo_perfil,
            exg_tipo_craneo,
            exg_tipo_cara,
            exg_forma_arcadas_dentarias,
            exg_forma_paladar,
            exg_observaciones_especiales
        } = body;

        if (!id_paciente) {
            return NextResponse.json({ error: "Falta id_paciente" }, { status: 400 });
        }

        const [result]: [QueryResult, FieldPacket[]] = await db.query(
            `INSERT INTO hismed07_exploracion_general (
                id_paciente, exg_presion_arterial, exg_frecuencia_respiratoria, exg_pulso, exg_temperatura,
                exg_peso_actual, exg_talla, exg_cabeza, exg_cuello, exg_higiene, exg_periodonto, exg_prevalencia_caries,
                exg_denticion, exg_dientes_faltantes, exg_dientes_retenidos, exg_dientes_impactados, exg_descalcificacion_dientes,
                exg_insercion_frenillos, exg_labios, exg_proporcion_lengua_arcos, exg_problemas_lenguaje, exg_terceros_molares,
                exg_habitos, exg_tipo_perfil, exg_tipo_craneo, exg_tipo_cara, exg_forma_arcadas_dentarias, exg_forma_paladar,
                exg_observaciones_especiales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_paciente),
                exg_presion_arterial ?? null,
                exg_frecuencia_respiratoria ?? null,
                exg_pulso ?? null,
                exg_temperatura ?? null,
                exg_peso_actual ?? null,
                exg_talla ?? null,
                exg_cabeza ?? null,
                exg_cuello ?? null,
                exg_higiene ?? null,
                exg_periodonto ?? null,
                exg_prevalencia_caries ?? null,
                exg_denticion ?? null,
                exg_dientes_faltantes ?? null,
                exg_dientes_retenidos ?? null,
                exg_dientes_impactados ?? null,
                exg_descalcificacion_dientes ?? null,
                exg_insercion_frenillos ?? null,
                exg_labios ?? null,
                exg_proporcion_lengua_arcos ?? null,
                exg_problemas_lenguaje ?? null,
                exg_terceros_molares ?? null,
                exg_habitos ?? null,
                exg_tipo_perfil ?? null,
                exg_tipo_craneo ?? null,
                exg_tipo_cara ?? null,
                exg_forma_arcadas_dentarias ?? null,
                exg_forma_paladar ?? null,
                exg_observaciones_especiales ?? null
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
            "SELECT id_paciente FROM hismed07_exploracion_general WHERE id_paciente = ?",
            [Number(id_paciente)]
        ) as [ExploracionGeneral[], FieldPacket[]];
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
            `UPDATE hismed07_exploracion_general SET ${updates} WHERE id_paciente = ?`,
            [...values, Number(id_paciente)]
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar exploración general" }, { status: 500 });
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
        "SELECT id_paciente FROM hismed07_exploracion_general WHERE id_paciente = ?",
        [Number(id_paciente)]
    ) as [ExploracionGeneral[], FieldPacket[]];
    if (!existRows || existRows.length === 0) {
        return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }
    await db.query("DELETE FROM hismed07_exploracion_general WHERE id_paciente = ?", [Number(id_paciente)]);
    return NextResponse.json({ success: true });
}