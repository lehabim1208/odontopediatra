// app/api/login/route.ts
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password, role } = await req.json();

  // Buscar usuario solo por usuario (sin filtrar por rol)
  const [rows]: any = await db.query(
    "SELECT * FROM usuarios WHERE usuario = ? LIMIT 1",
    [username]
  );
  const user = rows[0];

  if (!user) {
    return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos" }), { status: 401 });
  }

  // Verificar contraseña
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos" }), { status: 401 });
  }

  // Validar rol
  if (user.rol !== role) {
    return new Response(
      JSON.stringify({ error: "Rol incorrecto. Cambie de sección", correctRole: user.rol }),
      { status: 403 }
    );
  }

  // Puedes devolver más datos si lo necesitas
  return new Response(JSON.stringify({ success: true, user: { id: user.id, nombre: user.nombre, rol: user.rol } }), { status: 200 });
}