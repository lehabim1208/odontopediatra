import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Listar citas de un paciente específico
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paciente_id = searchParams.get("paciente_id");
    if (!paciente_id) {
      return NextResponse.json({ error: "Falta el parámetro paciente_id" }, { status: 400 });
    }
    const [rows] = await db.query("SELECT * FROM citas WHERE paciente_id = ? ORDER BY fecha_hora DESC", [paciente_id]);
    return NextResponse.json({ citas: rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 });
  }
}
