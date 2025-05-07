import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Listar todas las citas
export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM citas");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 });
  }
}

// POST: Crear una nueva cita
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      paciente_id,
      usuario_id,
      fecha_hora,
      tipo,
      duracion,
      notas,
      estado = "pendiente",
    } = body;
    const [result]: any = await db.query(
      `INSERT INTO citas (paciente_id, usuario_id, fecha_hora, tipo, duracion, notas, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paciente_id, usuario_id, fecha_hora, tipo, duracion, notas, estado]
    );
    return NextResponse.json({ id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
  }
}

// PUT: Actualizar una cita existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      paciente_id,
      usuario_id,
      fecha_hora,
      tipo,
      duracion,
      notas,
      estado,
    } = body;
    await db.query(
      `UPDATE citas SET paciente_id=?, usuario_id=?, fecha_hora=?, tipo=?, duracion=?, notas=?, estado=? WHERE id=?`,
      [paciente_id, usuario_id, fecha_hora, tipo, duracion, notas, estado, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar cita" }, { status: 500 });
  }
}

// DELETE: Eliminar una cita
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.query(`DELETE FROM citas WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar cita" }, { status: 500 });
  }
}

// PATCH: Confirmar o actualizar estado de una cita
export async function PATCH(req: NextRequest) {
  try {
    const { id, estado } = await req.json();
    await db.query(`UPDATE citas SET estado=? WHERE id=?`, [estado, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
