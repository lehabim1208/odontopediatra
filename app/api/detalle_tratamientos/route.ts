import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Obtener detalles de un tratamiento por id_tratamiento
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id_tratamiento = searchParams.get("id_tratamiento");
    if (!id_tratamiento) {
      return NextResponse.json({ error: "Falta el parámetro id_tratamiento" }, { status: 400 });
    }
    const [rows] = await db.query(
      "SELECT * FROM detalle_tratamientos WHERE id_tratamiento = ? ORDER BY id ASC",
      [id_tratamiento]
    );
    return NextResponse.json({ detalles: rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener detalles del tratamiento" }, { status: 500 });
  }
}
