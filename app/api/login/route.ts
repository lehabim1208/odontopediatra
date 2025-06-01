// app/api/login/route.ts
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Buscar usuario solo por usuario (sin filtrar por rol)
  const [rows]: any = await db.query(
    "SELECT * FROM usuarios WHERE usuario = ? LIMIT 1",
    [username]
  );
  const user = rows[0];

  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  // Verificar contraseña
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  // Ya no se valida el rol

  // Puedes devolver más datos si lo necesitas
  const response = NextResponse.json({ success: true, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  response.cookies.set('isLoggedIn', 'true', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
  return response;
}