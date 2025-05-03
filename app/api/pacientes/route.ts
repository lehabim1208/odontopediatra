import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader } from "mysql2"; // Asegúrate de importar este tipo

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const [rows] = await db.query(
        `SELECT 
          id, 
          nombre AS name, 
          nombre_tutor AS guardian, 
          edad AS age, 
          ultima_visita AS lastVisit, 
          sexo, 
          telefono AS phone, 
          telefono_secundario AS additionalPhone, 
          correo AS email, 
          fecha_creacion, 
          id_doctor
        FROM pacientes WHERE id = ?`,
        [id]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows[0]);
      } else {
        return NextResponse.json({}, { status: 404 });
      }
    } else {
      // Soporte para búsqueda global
      const search = searchParams.get("search")?.trim();
      if (search) {
        const [rows] = await db.query(`
          SELECT 
            id, 
            nombre AS name, 
            nombre_tutor AS guardian, 
            edad AS age, 
            ultima_visita AS lastVisit, 
            sexo, 
            telefono AS phone, 
            telefono_secundario AS additionalPhone, 
            correo AS email, 
            fecha_creacion, 
            id_doctor
          FROM pacientes
          WHERE nombre LIKE ? OR nombre_tutor LIKE ?
          ORDER BY id DESC
        `, [`%${search}%`, `%${search}%`]);
        return NextResponse.json({ patients: rows, total: Array.isArray(rows) ? rows.length : 0 });
      }
      // Soporte para paginación
      const limit = parseInt(searchParams.get("limit") || "10", 10)
      const offset = parseInt(searchParams.get("offset") || "0", 10)
      // Obtener el total de pacientes
      const [totalRows] = await db.query("SELECT COUNT(*) as total FROM pacientes") as any[];
      const total = totalRows[0]?.total || 0;
      const [rows] = await db.query(`
        SELECT 
          id, 
          nombre AS name, 
          nombre_tutor AS guardian, 
          edad AS age, 
          ultima_visita AS lastVisit, 
          sexo, 
          telefono AS phone, 
          telefono_secundario AS additionalPhone, 
          correo AS email, 
          fecha_creacion, 
          id_doctor
        FROM pacientes
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      return NextResponse.json({ patients: rows, total });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      guardian,
      age,
      phone,
      additionalPhone,
      email,
      sexo = null,
      id_doctor = null
    } = body;

    if (!name || !guardian || !age || !phone) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Se define el tipo ResultSetHeader para el resultado de la consulta
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO pacientes (nombre, nombre_tutor, edad, telefono, telefono_secundario, correo, sexo, id_doctor, ultima_visita, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, guardian, age, phone, additionalPhone || null, email || null, sexo, id_doctor]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar paciente" }, { status: 500 });
  }
}