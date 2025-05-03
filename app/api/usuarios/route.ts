import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const [rows] = await db.query("SELECT id, nombre, usuario, correo, rol, permisos, fecha_creacion FROM usuarios");
  const users = (rows as any[]).map((u: any) => ({
    id: u.id,
    name: u.nombre,
    username: u.usuario,
    email: u.correo,
    role: u.rol,
    permissions: u.permisos ? JSON.parse(u.permisos) : {},
    fecha_creacion: u.fecha_creacion,
  }));
  return Response.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, username, email, password, role, permissions } = body;
  if (!name || !username || !email || !password || !role) {
    return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  // Validar usuario único
  const [exists] = await db.query("SELECT id FROM usuarios WHERE usuario = ? OR correo = ?", [username, email]);
  if ((exists as any[]).length > 0) {
    return Response.json({ error: "El usuario o correo ya existe" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO usuarios (nombre, usuario, correo, password, rol, permisos) VALUES (?, ?, ?, ?, ?, ?)",
    [name, username, email, hash, role, JSON.stringify(permissions || {})]
  );
  return Response.json({ success: true });
}
