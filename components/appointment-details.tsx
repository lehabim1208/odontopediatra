"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, MapPin, User, Phone, FileText, Timer } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AppointmentDetailsProps {
  appointment: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToConfirm?: (appointment: any) => void // Nueva prop opcional
}

export function AppointmentDetails({ appointment, open, onOpenChange, onGoToConfirm }: AppointmentDetailsProps) {
  if (!appointment) return null

  // Soportar fecha y hora en appointment.fecha_hora (formato ISO)
  let formattedDate = "-"
  let formattedTime = "-"
  let appointmentDateObj: Date | null = null
  if (appointment.date && appointment.time) {
    try {
      appointmentDateObj = parseISO(`${appointment.date}T${appointment.time}`)
    } catch {}
  } else if (appointment.fecha_hora) {
    try {
      // Forzar parse en zona local (México central)
      appointmentDateObj = new Date(appointment.fecha_hora)
    } catch {}
  }
  if (appointmentDateObj && !isNaN(appointmentDateObj.getTime())) {
    formattedDate = format(appointmentDateObj, "EEEE d 'de' MMMM, yyyy", { locale: es })
    // Hora en formato 12h con am/pm
    formattedTime = format(appointmentDateObj, "h:mm a", { locale: es })
  }

  const isPending = appointment.estado === "pendiente" || appointment.confirmed === false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-blue-700 font-bold">Detalle de la cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="text-blue-700 font-bold text-base mb-2">Información de la cita</h3>
              <h3 className="text-lg font-semibold mb-3 border-b pb-1">{appointment.tipo || appointment.type || "Consulta general"}</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-muted-foreground">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hora</p>
                    <p className="text-muted-foreground">{formattedTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Timer className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Duración</p>
                    <p className="text-muted-foreground">{appointment.duracion || appointment.duration || "-"} min</p>
                  </div>
                </div>
                {(appointment.notes || appointment.notas) && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Notas</p>
                      <p className="text-muted-foreground">{appointment.notes || appointment.notas}</p>
                    </div>
                  </div>
                )}
                {appointment.doctor && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Doctor</p>
                      <p className="text-muted-foreground">{appointment.doctor}</p>
                    </div>
                  </div>
                )}
                {appointment.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p className="text-muted-foreground">{appointment.location}</p>
                    </div>
                  </div>
                )}
                {appointment.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Teléfono de contacto</p>
                      <p className="text-muted-foreground">{appointment.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Estado</p>
              <div className="mt-1">
                {appointment.estado === "cancelada" ? (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Cancelada</span>
                ) : appointment.estado === "confirmada" || appointment.confirmed ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Confirmada</span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Pendiente</span>
                )}
              </div>
            </div>
            {/* Botón Ir a confirmar si está pendiente y hay handler */}
            {isPending && onGoToConfirm && (
              <Button style={{ backgroundColor: '#e0edff', color: '#2563eb', border: '1px solid #2563eb' }} onClick={() => onGoToConfirm(appointment)}>
                Ir a confirmar
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
