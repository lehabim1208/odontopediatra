import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET() {
  // Próximos 7 días
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [rows]: any = await db.query(
    `SELECT c.id, c.fecha_hora, c.tipo, c.duracion, c.estado, p.nombre as patientName
     FROM citas c
     JOIN pacientes p ON c.paciente_id = p.id
     WHERE c.fecha_hora >= ? AND c.fecha_hora <= ?
       AND c.estado != 'cancelada'
     ORDER BY c.fecha_hora ASC
     LIMIT 20`,
    [format(now, "yyyy-MM-dd 00:00:00"), format(sevenDaysLater, "yyyy-MM-dd 23:59:59")]
  );
  const upcomingAppointments = rows.map((cita: any) => {
    const fecha = new Date(cita.fecha_hora);
    return {
      id: cita.id,
      patientName: cita.patientName,
      type: cita.tipo,
      confirmed: cita.estado === "confirmada",
      formattedDate: format(fecha, "d 'de' MMMM, yyyy", { locale: es }),
      formattedTime: format(fecha, "hh:mm aaaa", { locale: es }),
      duration: `${cita.duracion} min`,
    };
  });
  return new Response(JSON.stringify({ upcomingAppointments }), { status: 200 });
}
