import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tutor_id = searchParams.get('tutor_id');
    if (!tutor_id) return NextResponse.json({ success: false, error: 'Falta tutor_id' }, { status: 400 });
    const [rows] = await db.query('SELECT id FROM tareas_huella WHERE id_tutor = ? AND estado = ? LIMIT 1', [tutor_id, 'pendiente']);
    const hasPending = Array.isArray(rows) && rows.length > 0;
    return NextResponse.json({ success: true, hasPending });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
