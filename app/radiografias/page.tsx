"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploaderWrapper } from "@/components/uploader-wrapper"

export default function RadiografiaPage() {
  const searchParams = useSearchParams()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        let patientId = searchParams.get("patient")

        // Usar clave única para radiografías
        const storageKey = 'radiografias_selectedPatientId';

        if (patientId) {
          // Si viene por query, actualizar storage
          sessionStorage.setItem(storageKey, patientId)
        } else if (typeof window !== 'undefined') {
          patientId = sessionStorage.getItem(storageKey)
        }

        if (patientId) {
          const response = await fetch(`/api/pacientes?id=${patientId}`)
          if (response.ok) {
            const patientData = await response.json()
            setPatient(patientData)
          }
        }
      } catch (error) {
        console.error("Error fetching patient:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatient()
  }, [searchParams])

  if (loading) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
      }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-2" />
          <div className="text-lg font-semibold text-blue-700">Cargando</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary brand-name">Documentos Médicos</h1>
          {patient && <p className="text-muted-foreground">Paciente: {patient.name}</p>}
        </div>
      </div>

      {patient ? (
        <UploaderWrapper patientId={patient.id.toString()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">Seleccione un paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8 text-muted-foreground">
              Por favor seleccione un paciente para ver sus documentos médicos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}