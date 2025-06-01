import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/odontograma?id_paciente=123
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id_paciente = searchParams.get("id_paciente")
  const latest = searchParams.get("latest")
  if (!id_paciente) {
    return NextResponse.json({ error: "Falta el parámetro id_paciente" }, { status: 400 })
  }
  try {
    let query = `SELECT id, id_paciente, fecha_hora, notas, json_vector, historial_cambios FROM odontograma WHERE id_paciente = ? ORDER BY fecha_hora DESC`
    let params: any[] = [id_paciente]
    if (latest === "1") {
      query += " LIMIT 1"
    }
    const [rows] = await db.query(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener odontogramas" }, { status: 500 })
  }
}

// POST /api/odontograma
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[ODONTOGRAMA][POST] body recibido:", body)
    const { id_paciente, fecha_hora, notas, json_vector, historial_cambios } = body
    if (!id_paciente || !fecha_hora || !json_vector) {
      console.error("[ODONTOGRAMA][POST] Faltan campos obligatorios", { id_paciente, fecha_hora, json_vector })
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }
    // Convertir fecha_hora a formato compatible con MySQL DATETIME
    function toMySQLDateTime(dateString: string) {
      const d = new Date(dateString)
      // YYYY-MM-DD HH:MM:SS
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0')
    }
    const fechaHoraMySQL = toMySQLDateTime(fecha_hora)
    let jsonVectorStr
    try {
      jsonVectorStr = typeof json_vector === "string" ? json_vector : JSON.stringify(json_vector)
    } catch (err) {
      console.error("[ODONTOGRAMA][POST] Error al serializar json_vector", err)
      return NextResponse.json({ error: "json_vector inválido" }, { status: 400 })
    }
    let historialCambiosStr
    try {
      historialCambiosStr = historial_cambios == null ? null : JSON.stringify(historial_cambios)
    } catch (err) {
      console.error("[ODONTOGRAMA][POST] Error al serializar historial_cambios", err)
      return NextResponse.json({ error: "historial_cambios inválido" }, { status: 400 })
    }
    try {
      const [result] = await db.query(
        `INSERT INTO odontograma (id_paciente, fecha_hora, notas, json_vector, historial_cambios)
         VALUES (?, ?, ?, ?, ?)`,
        [id_paciente, fechaHoraMySQL, notas || null, jsonVectorStr, historialCambiosStr]
      )
      const insertId = (result as any).insertId
      console.log("[ODONTOGRAMA][POST] Insert exitoso, insertId:", insertId)
      return NextResponse.json({ success: true, id: insertId })
    } catch (dbError) {
      console.error("[ODONTOGRAMA][POST] Error en query SQL:", dbError)
      // DEVOLVER EL MENSAJE DE ERROR SQL EN LA RESPUESTA PARA DEPURAR
      return NextResponse.json({ error: "Error al guardar odontograma (DB)", dbError: (dbError as any)?.message || dbError }, { status: 500 })
    }
  } catch (error) {
    console.error("[ODONTOGRAMA][POST] Error general:", error)
    return NextResponse.json({ error: "Error al guardar odontograma" }, { status: 500 })
  }
}