import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Listar tratamientos de un paciente específico
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paciente_id = searchParams.get("paciente_id");
    if (!paciente_id) {
      return NextResponse.json({ error: "Falta el parámetro paciente_id" }, { status: 400 });
    }
    const [rows] = await db.query("SELECT * FROM tratamientos WHERE id_paciente = ? ORDER BY fecha_creacion DESC", [paciente_id]);
    return NextResponse.json({ tratamientos: rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener tratamientos" }, { status: 500 });
  }
}
