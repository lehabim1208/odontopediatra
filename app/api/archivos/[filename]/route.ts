import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"

// GET /api/archivos/[filename] - Servir archivo privado
export async function GET(req: NextRequest, context: { params: { filename: string } }) {
  const filename = context.params.filename
  if (!filename) {
    return NextResponse.json({ error: "Falta el nombre del archivo" }, { status: 400 })
  }

  // Solo permitir extensiones seguras
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".pdf"]
  const ext = path.extname(filename).toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    return NextResponse.json({ error: "Extensión de archivo no permitida" }, { status: 403 })
  }

  const filePath = path.join(process.cwd(), "private", "archivos", filename)
  try {
    const fileBuffer = await fs.readFile(filePath)
    let contentType = "application/octet-stream"
    if (ext === ".pdf") contentType = "application/pdf"
    if ([".jpg", ".jpeg"].includes(ext)) contentType = "image/jpeg"
    if (ext === ".png") contentType = "image/png"
    if (ext === ".gif") contentType = "image/gif"

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename=\"${filename}\"`,
        "Cache-Control": "private, max-age=31536000"
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
  }
}
