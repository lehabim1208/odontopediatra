"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, MapPin, User, Phone, FileText } from "lucide-react"

interface AppointmentDetailsProps {
  appointment: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetails({ appointment, open, onOpenChange }: AppointmentDetailsProps) {
  if (!appointment) return null

  const appointmentDate = parseISO(`${appointment.date}T${appointment.time}`)
  const formattedDate = format(appointmentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })
  const formattedTime = format(appointmentDate, "HH:mm", { locale: es })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="section-title">Detalle de la Cita</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-accent rounded-lg">
            <h3 className="text-lg font-semibold mb-3 border-b pb-1">{appointment.type || "Consulta general"}</h3>
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
              {appointment.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Notas</p>
                    <p className="text-muted-foreground">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Estado</p>
              <div className="mt-1">
                {appointment.confirmed ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Confirmada</span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Pendiente</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
