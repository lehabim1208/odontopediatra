import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// POST: Registrar tarea de huella (registro o comparación)
export async function POST(req: NextRequest) {
  try {
    const { tutor_id, dedo, tipo = "registro", id_tratamiento = null, tratamiento_aprobado = null } = await req.json();
    // 1. Crear tarea de huella (registro o comparación)
    const [result] = await db.query(
      "INSERT INTO tareas_huella (id_tutor, tipo, estado, dedo, fecha_creacion, fecha_actualizacion, id_tratamiento, tratamiento_aprobado) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?)",
      [tutor_id, tipo, "pendiente", dedo, id_tratamiento, tratamiento_aprobado]
    );
    const insertId = (result as any).insertId;
    return NextResponse.json({ success: true, task_id: insertId });
  } catch (error: any) {
    console.error("Error creando tarea de huella:", error);
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}

// GET: Consultar si la tarea ya fue completada
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const task_id = searchParams.get("task_id");
    const tutor_id = searchParams.get("tutor_id");
    if (task_id) {
      // Buscar tarea de huella
      const [rows] = await db.query("SELECT estado, resultado FROM tareas_huella WHERE id = ?", [task_id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: "Tarea no encontrada" }, { status: 404 });
      }
      const row = (rows as any[])[0];
      const completed = row.estado === "completado";
      const failed = row.estado === "fallido";
      return NextResponse.json({
        success: true,
        completed,
        failed,
        resultado: row.resultado || null,
        estado: row.estado
      });
    } else if (tutor_id) {
      // Buscar huella del tutor
      const [rows]: any = await db.query("SELECT dedo FROM huellas WHERE tutor_id = ? LIMIT 1", [tutor_id]);
      if (rows.length === 0) {
        return NextResponse.json({ error: "No se encontró huella para el tutor" }, { status: 404 });
      }
      return NextResponse.json({ dedo: rows[0].dedo });
    } else {
      return NextResponse.json({ error: "Falta parámetro task_id o tutor_id" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error en /api/huellas GET:", error);
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 });
  }
}

// GET: Consultar si hay tarea pendiente para un tutor
export async function GET_PENDING(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tutor_id = searchParams.get("tutor_id");
    if (!tutor_id) return NextResponse.json({ success: false, error: "Falta tutor_id" }, { status: 400 });
    const [rows] = await db.query("SELECT id FROM tareas_huella WHERE id_tutor = ? AND estado = ? LIMIT 1", [tutor_id, "pendiente"]);
    const hasPending = Array.isArray(rows) && rows.length > 0;
    return NextResponse.json({ success: true, hasPending });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Marcar tarea de huella como fallida (timeout de registro o verificación)
export async function PATCH(req: NextRequest) {
  try {
    const { task_id, resultado, tipo } = await req.json();
    if (!task_id) return NextResponse.json({ success: false, error: "Falta task_id" }, { status: 400 });
    let resultadoFinal = 'Tiempo de espera agotado para la verificación de huella';
    if (tipo === 'registro') {
      resultadoFinal = 'Tiempo de espera agotado para el registro de huella';
    } else if (resultado) {
      resultadoFinal = resultado;
    }
    await db.query(
      "UPDATE tareas_huella SET estado = 'fallido', resultado = ?, fecha_actualizacion = NOW() WHERE id = ?",
      [resultadoFinal, task_id]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
