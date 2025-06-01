import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Next.js App Router recomienda usar async/await para obtener params en handlers dinámicos
export async function GET(req: NextRequest) {
  // Obtener params asincrónicamente
  const { searchParams, pathname } = new URL(req.url);
  // Extraer el id de la URL (último segmento)
  const id = pathname.split("/").pop();
  try {
    if (!id) {
      return NextResponse.json({ ok: false, error: "Falta el id" }, { status: 400 });
    }
    // Obtener tratamiento principal
    const [tratamientos]: any = await db.query(
      `SELECT * FROM tratamientos WHERE id = ?`,
      [id]
    );
    if (!tratamientos || tratamientos.length === 0) {
      return NextResponse.json({ ok: false, error: "Tratamiento no encontrado" }, { status: 404 });
    }
    const tratamiento = tratamientos[0];
    // Obtener detalles
    const [detalles]: any = await db.query(
      `SELECT * FROM detalle_tratamientos WHERE id_tratamiento = ?`,
      [id]
    );
    tratamiento.detalles = detalles;
    return NextResponse.json(tratamiento);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}