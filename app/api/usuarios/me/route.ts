import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Falta el id de usuario" }), { status: 400 });
  }
  const [rows]: any = await db.query("SELECT id, nombre, rol FROM usuarios WHERE id = ? LIMIT 1", [id]);
  if (!rows[0]) {
    return new Response(JSON.stringify({ error: "Usuario no encontrado" }), { status: 404 });
  }
  return new Response(JSON.stringify(rows[0]), { status: 200 });
}
