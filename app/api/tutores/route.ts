import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Obtener tutores de un paciente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paciente_id = searchParams.get("paciente_id");
    if (!paciente_id) {
      return NextResponse.json({ error: "Falta paciente_id" }, { status: 400 });
    }
    const [rows]: any = await db.query(
      `SELECT t.id, t.nombre, t.telefono, t.correo, t.relacion, h.id as huella_id FROM paciente_tutor pt JOIN tutores t ON pt.tutor_id = t.id LEFT JOIN huellas h ON h.tutor_id = t.id WHERE pt.paciente_id = ?`,
      [paciente_id]
    );
    return NextResponse.json({ tutores: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Registrar tutor y asociar a paciente
export async function POST(req: NextRequest) {
  try {
    const { nombre, telefono, correo, relacion, paciente_id } = await req.json();

    // 1. Crear tutor
    const [result] = await db.query(
      'INSERT INTO tutores (nombre, telefono, correo, relacion) VALUES (?, ?, ?, ?)',
      [nombre, telefono, correo, relacion]
    );
    const insertId = (result as any).insertId;

    // 2. Asociar tutor a paciente
    await db.query(
      'INSERT INTO paciente_tutor (paciente_id, tutor_id) VALUES (?, ?)',
      [paciente_id, insertId]
    );

    return NextResponse.json({ success: true, tutor_id: insertId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
