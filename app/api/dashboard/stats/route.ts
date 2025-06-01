import { db } from "@/lib/db";

export async function GET() {
  const [[{ totalAppointments }]]: any = await db.query("SELECT COUNT(*) as totalAppointments FROM citas");
  const [[{ totalPatients }]]: any = await db.query("SELECT COUNT(*) as totalPatients FROM pacientes");
  return new Response(JSON.stringify({ totalAppointments, totalPatients }), { status: 200 });
}
