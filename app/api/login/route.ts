// app/api/login/route.ts
import { db, supa } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Buscar usuario
  const [rows]: any = await db.query("SELECT * FROM usuarios WHERE usuario = ? LIMIT 1", [username]);
  const user = rows[0];

  if (!user) return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });

  let accion = 0;

  try {
    const { data, error } = await supa.from("licencias").select("accion").eq("id", 1).single();
    if (error) throw error;

    accion = data?.accion ?? 0;

    if (accion !== 0) {
      // Actualiza base local con valor de Supabase
      await db.query("UPDATE licencias SET accion = ? WHERE id = 1", [accion]);
    }
  } catch (err) {
    // Si falla Supabase, revisa valor local
    const [licencias]: any = await db.query("SELECT accion FROM licencias WHERE id = 1");
    accion = licencias[0]?.accion ?? 0;
  }

  if (accion !== 0) {
    return NextResponse.json({ licenciaError: accion }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  response.cookies.set("isLoggedIn", "true", {
    path: "/",
    maxAge: 86400,
    sameSite: "lax",
  });
  return response;
}