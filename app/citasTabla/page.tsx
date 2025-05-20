"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Appointment {
  id: number
  paciente_id: number
  usuario_id: number
  fecha_hora: string
  tipo: string
  duracion: string
  notas: string
  estado: string
  patientName?: string
}

export default function CitasTablaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true)
      const res = await fetch("/api/citas")
      if (res.ok) {
        const data = await res.json()
        // Obtener nombres de pacientes
        const uniqueIds = Array.from(new Set(data.map((a: any) => a.paciente_id)))
        let patientMap: Record<number, string> = {}
        if (uniqueIds.length > 0) {
          const resP = await fetch(`/api/pacientes?ids=${uniqueIds.join(",")}`)
          if (resP.ok) {
            const pdata = await resP.json()
            if (Array.isArray(pdata)) {
              pdata.forEach((p: any) => { patientMap[p.id] = p.name })
            } else if (Array.isArray(pdata.patients)) {
              pdata.patients.forEach((p: any) => { patientMap[p.id] = p.name })
            }
          }
        }
        setAppointments(
          data.map((a: any) => ({
            ...a,
            patientName: patientMap[a.paciente_id] || "",
          }))
        )
      }
      setLoading(false)
    }
    fetchAppointments()
  }, [])

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase()
    return (
      a.patientName?.toLowerCase().includes(q) ||
      a.tipo.toLowerCase().includes(q) ||
      a.estado.toLowerCase().includes(q) ||
      a.fecha_hora.toLowerCase().includes(q) ||
      a.notas.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Todas las citas</h1>
          <p className="text-muted-foreground">Visualiza y busca todas las citas registradas</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/citas")}>Volver a agenda</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Buscar cita</CardTitle>
          <Input
            placeholder="Buscar por paciente, tipo, estado, fecha o notas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border px-2 py-1">Paciente</th>
                <th className="border px-2 py-1">Tipo</th>
                <th className="border px-2 py-1">Fecha</th>
                <th className="border px-2 py-1">Hora</th>
                <th className="border px-2 py-1">Duración</th>
                <th className="border px-2 py-1">Estado</th>
                <th className="border px-2 py-1">Notas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4">No hay citas</td></tr>
              ) : (
                filtered.map(a => {
                  const fecha = new Date(a.fecha_hora)
                  const date = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                  const time = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
                  return (
                    <tr key={a.id} className={
                      a.estado === "cancelada" ? "bg-red-100" :
                      a.estado === "confirmada" ? "bg-green-100" : ""
                    }>
                      <td className="border px-2 py-1 font-medium">{a.patientName}</td>
                      <td className="border px-2 py-1">{a.tipo}</td>
                      <td className="border px-2 py-1">{date}</td>
                      <td className="border px-2 py-1">{time}</td>
                      <td className="border px-2 py-1">{a.duracion} min</td>
                      <td className="border px-2 py-1 capitalize">{a.estado}</td>
                      <td className="border px-2 py-1">{a.notas}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
