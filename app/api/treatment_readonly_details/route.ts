import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Forzar tipo usando unknown primero, luego [any[], any]
  const [tratamientosRows] = (await db.query(
    `SELECT * FROM tratamientos WHERE id = ? LIMIT 1`,
    [id]
  )) as unknown as [any[], any];
  const tratamiento =
    Array.isArray(tratamientosRows) && tratamientosRows.length > 0
      ? tratamientosRows[0]
      : undefined;
  if (!tratamiento) {
    return NextResponse.json({ error: "Tratamiento no encontrado" }, { status: 404 });
  }

  // Obtener el tutor
  let tutor = null;
  if (tratamiento.aprobado_por_idtutor) {
    const [tutoresRows] = (await db.query(
      `SELECT * FROM tutores WHERE id = ? LIMIT 1`,
      [tratamiento.aprobado_por_idtutor]
    )) as unknown as [any[], any];
    tutor = Array.isArray(tutoresRows) && tutoresRows.length > 0 ? tutoresRows[0] : null;
  }

  // Obtener el paciente
  let paciente = null;
  if (tratamiento.id_paciente) {
    const [pacientesRows] = (await db.query(
      `SELECT nombre, edad FROM pacientes WHERE id = ? LIMIT 1`,
      [tratamiento.id_paciente]
    )) as unknown as [any[], any];
    paciente = Array.isArray(pacientesRows) && pacientesRows.length > 0 ? pacientesRows[0] : null;
  }

  // Obtener los detalles del tratamiento
  const [detallesRows] = (await db.query(
    `SELECT id, organo_dentario, tratamiento_convencional, tratamiento_recomendado, precio_convencional, precio_recomendado FROM detalle_tratamientos WHERE id_tratamiento = ?`,
    [id]
  )) as unknown as [any[], any];

  return NextResponse.json({
    tratamiento: {
      id: tratamiento.id,
      convencionalTotal: tratamiento.total_convencional,
      recommendedTotal: tratamiento.total_recomendado,
      approvedType: tratamiento.tratamiento_aprobado,
      fingerprintData: tratamiento.aprobacion,
      approvedDate: tratamiento.fecha_aprobado,
      approvedByName: tutor ? tutor.nombre : null,
      rows: Array.isArray(detallesRows)
        ? detallesRows.map((d) => ({
            id: d.id,
            toothNumber: d.organo_dentario,
            conventionalTreatment: d.tratamiento_convencional,
            recommendedTreatment: d.tratamiento_recomendado,
            conventionalPrice: d.precio_convencional,
            recommendedPrice: d.precio_recomendado,
          }))
        : [],
    },
    patient: {
      name: paciente ? paciente.nombre : null,
      age: paciente ? paciente.edad : null,
      guardian: tutor ? tutor.nombre : null,
    },
  });
}
