import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const [rows] = await db.query("SELECT id, nombre, usuario, correo, rol, permisos, fecha_creacion FROM usuarios WHERE id = ?", [id]);
  const rowsArr = rows as any[];
  if (rowsArr.length === 0) return Response.json({ error: "No encontrado" }, { status: 404 });
  const u = rowsArr[0];
  return Response.json({
    id: u.id,
    name: u.nombre,
    username: u.usuario,
    email: u.correo,
    role: u.rol,
    permissions: u.permisos ? JSON.parse(u.permisos) : {},
    fecha_creacion: u.fecha_creacion,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  if (id === 1 && !body.allowAdminEdit) {
    return Response.json({ error: "No se puede editar el admin desde aquí" }, { status: 400 });
  }
  const { name, username, email, password, role, permissions } = body;

  // Obtener permisos actuales si no se envían en el body
  let permisosFinal = permissions;
  if (typeof permisosFinal === "undefined") {
    const [rows] = await db.query("SELECT permisos FROM usuarios WHERE id = ?", [id]) as any[];
    permisosFinal = Array.isArray(rows) && rows.length > 0 ? rows[0].permisos : "{}";
  }

  let query = "UPDATE usuarios SET nombre=?, usuario=?, correo=?";
  let values: any[] = [name, username, email];
  if (typeof permisosFinal !== "undefined") {
    query += ", permisos=?";
    values.push(typeof permisosFinal === "string" ? permisosFinal : JSON.stringify(permisosFinal));
  }
  if (password && password.length > 0) {
    const hash = await bcrypt.hash(password, 10);
    query += ", password=?";
    values.push(hash);
  }
  query += " WHERE id=?";
  values.push(id);
  await db.query(query, values);
  return Response.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (id === 1) return Response.json({ error: "No se puede eliminar el admin" }, { status: 400 });
  try {
    await db.query("DELETE FROM usuarios WHERE id=?", [id]);
    return Response.json({ success: true });
  } catch (err: any) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return Response.json({
        error: "No se puede eliminar este usuario porque tiene pacientes asignados. Asigne los pacientes a otro usuario antes de eliminar.",
        mysqlMessage: err.sqlMessage
      }, { status: 400 });
    }
    return Response.json({ error: "Error al eliminar usuario", mysqlMessage: err.sqlMessage || String(err) }, { status: 500 });
  }
}
