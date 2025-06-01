import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET: Obtener la información del consultorio (primer registro)
export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, correo, telefono, direccion, logo_ruta FROM consultorio LIMIT 1"
    )
    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json(rows[0])
    } else {
      return NextResponse.json({}, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener información del consultorio" }, { status: 500 })
  }
}

// PUT: Actualizar la información del consultorio
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { nombre, correo, telefono, direccion, logo_ruta } = body
    // Buscar el id del consultorio
    const [rows] = await db.query("SELECT id FROM consultorio LIMIT 1")
    let id = null
    if (Array.isArray(rows) && rows.length > 0 && typeof rows[0].id !== "undefined") {
      id = rows[0].id
    }
    if (!id) {
      return NextResponse.json({ error: "No existe registro de consultorio" }, { status: 404 })
    }
    await db.query(
      "UPDATE consultorio SET nombre=?, correo=?, telefono=?, direccion=?, logo_ruta=? WHERE id=?",
      [nombre, correo, telefono, direccion, logo_ruta || null, id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar información del consultorio" }, { status: 500 })
  }
}
