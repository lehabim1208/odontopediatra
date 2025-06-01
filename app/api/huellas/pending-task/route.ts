import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tutor_id = searchParams.get('tutor_id');
    if (!tutor_id) return NextResponse.json({ success: false, error: 'Falta tutor_id' }, { status: 400 });
    // Buscar la tarea más reciente para el tutor
    const [rows] = await db.query(
      'SELECT id, estado FROM tareas_huella WHERE id_tutor = ? ORDER BY id DESC LIMIT 1',
      [tutor_id]
    );
    const typedRows = rows as { id: number, estado: string }[];
    const hasTask = Array.isArray(typedRows) && typedRows.length > 0;
    const taskId = hasTask ? typedRows[0].id : null;
    const estado = hasTask ? typedRows[0].estado : null;
    // Si la tarea existe y está pendiente
    const hasPending = hasTask && estado === 'pendiente';
    // Si la tarea existe y está completada
    const isCompleted = hasTask && estado === 'completado';
    return NextResponse.json({ success: true, hasPending, taskId, isCompleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
