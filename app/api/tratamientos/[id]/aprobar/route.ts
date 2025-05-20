import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Extraer el id de la URL usando req.nextUrl
    const url = req.nextUrl || new URL(req.url!);
    const id = url.pathname.split("/").slice(-2, -1)[0];
    const body = await req.json();
    console.log("[API aprobar tratamiento] id:", id, "body:", body);
    const {
      estado,
      aprobacion,
      aprobado_por_idtutor,
      fecha_aprobado,
      tratamiento_aprobado,
      total_convencional,
      total_recomendado
    } = body;
    // Convertir fecha_aprobado a formato YYYY-MM-DD para MySQL
    let fechaAprobadoSQL = fecha_aprobado;
    if (typeof fecha_aprobado === "string" && fecha_aprobado.includes("T")) {
      fechaAprobadoSQL = fecha_aprobado.split("T")[0];
    }
    if (!id || !estado || !aprobacion || !aprobado_por_idtutor || !fecha_aprobado || !tratamiento_aprobado || total_convencional == null || total_recomendado == null) {
      console.error("[API aprobar tratamiento] Faltan datos obligatorios", { id, estado, aprobacion, aprobado_por_idtutor, fecha_aprobado, tratamiento_aprobado, total_convencional, total_recomendado });
      return NextResponse.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }
    try {
      const [result]: any = await db.query(
        `UPDATE tratamientos SET estado = ?, aprobacion = ?, aprobado_por_idtutor = ?, fecha_aprobado = ?, tratamiento_aprobado = ?, total_convencional = ?, total_recomendado = ? WHERE id = ?`,
        [estado, aprobacion, aprobado_por_idtutor, fechaAprobadoSQL, tratamiento_aprobado, total_convencional, total_recomendado, id]
      );
      console.log("[API aprobar tratamiento] SQL result:", result);
      return NextResponse.json({ ok: true, affectedRows: result.affectedRows });
    } catch (sqlError: any) {
      console.error("[API aprobar tratamiento] SQL error:", sqlError);
      return NextResponse.json({ ok: false, error: sqlError.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[API aprobar tratamiento] General error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
