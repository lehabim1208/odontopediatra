import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_paciente,
      total_convencional,
      total_recomendado,
      detalles = []
    } = body;

    if (!id_paciente || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    // Insertar tratamiento principal
    const [tratamientoResult]: any = await db.query(
      `INSERT INTO tratamientos (id_paciente, estado, total_convencional, total_recomendado, fecha_creacion) VALUES (?, 'pendiente', ?, ?, NOW())`,
      [id_paciente, total_convencional, total_recomendado]
    );
    const id_tratamiento = tratamientoResult.insertId;

    // Insertar detalles
    const detallePromises = detalles.map((d: any) =>
      db.query(
        `INSERT INTO detalle_tratamientos (id_tratamiento, organo_dentario, tratamiento_convencional, tratamiento_recomendado, precio_convencional, precio_recomendado) VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          id_tratamiento,
          d.organo_dentario,
          d.tratamiento_convencional,
          d.tratamiento_recomendado,
          d.precio_convencional,
          d.precio_recomendado
        ]
      )
    );
    await Promise.all(detallePromises);

    return NextResponse.json({ ok: true, id_tratamiento });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paciente_id = searchParams.get("paciente_id");
    const estado = searchParams.get("estado");
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const sort = searchParams.get("sort") || "desc";

    let query = `SELECT * FROM tratamientos`;
    const where: string[] = [];
    const params: any[] = [];
    if (paciente_id) {
      where.push("id_paciente = ?");
      params.push(paciente_id);
    }
    if (estado) {
      where.push("estado = ?");
      params.push(estado);
    }
    if (where.length > 0) {
      query += ` WHERE ` + where.join(" AND ");
    }
    query += ` ORDER BY id DESC`;
    if (limit && limit > 0) {
      query += ` LIMIT ?`;
      params.push(limit);
    }
    const [rows]: any = await db.query(query, params);
    return NextResponse.json({ tratamientos: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_tratamiento,
      id_paciente,
      total_convencional,
      total_recomendado,
      detalles = []
    } = body;
    if (!id_tratamiento || !id_paciente || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }
    // Actualizar tratamiento principal
    await db.query(
      `UPDATE tratamientos SET id_paciente = ?, total_convencional = ?, total_recomendado = ? WHERE id = ?`,
      [id_paciente, total_convencional, total_recomendado, id_tratamiento]
    );
    // Eliminar detalles previos
    await db.query(`DELETE FROM detalle_tratamientos WHERE id_tratamiento = ?`, [id_tratamiento]);
    // Insertar nuevos detalles
    const detallePromises = detalles.map((d: any) =>
      db.query(
        `INSERT INTO detalle_tratamientos (id_tratamiento, organo_dentario, tratamiento_convencional, tratamiento_recomendado, precio_convencional, precio_recomendado) VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          id_tratamiento,
          d.organo_dentario,
          d.tratamiento_convencional,
          d.tratamiento_recomendado,
          d.precio_convencional,
          d.precio_recomendado
        ]
      )
    );
    await Promise.all(detallePromises);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
