"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SignaturePad } from "@/components/signature-pad"
import { Save, Printer } from "lucide-react"

export default function AutorizacionPage({ params }: { params: { id: string } }) {
  const [guardianName, setGuardianName] = useState("")
  const [patientName, setPatientName] = useState("")
  const [relationship, setRelationship] = useState("")
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)

  const handleSave = () => {
    // In a real app, this would save the authorization to the database
    console.log("Saving authorization", {
      guardianName,
      patientName,
      relationship,
      signatureData,
      agreed,
    })
    alert("Autorización guardada correctamente")
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Formulario de Autorización</h1>
          <p className="text-muted-foreground">Consentimiento para tratamiento odontológico</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Información del Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientName">Nombre completo del paciente</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre del paciente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientId">ID del Paciente</Label>
              <Input id="patientId" value={params.id} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Información del Tutor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Nombre completo del tutor</Label>
              <Input
                id="guardianName"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Nombre del tutor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Parentesco con el paciente</Label>
              <Input
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Ej: Madre, Padre, Tutor legal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Términos y Condiciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="mb-4">
                Por medio de la presente, yo <strong>{guardianName || "[Nombre del Tutor]"}</strong>, en mi calidad de{" "}
                <strong>{relationship || "[Parentesco]"}</strong> del menor
                <strong> {patientName || "[Nombre del Paciente]"}</strong>, autorizo al personal médico de este
                consultorio odontológico a realizar los procedimientos diagnósticos y terapéuticos que consideren
                necesarios para la atención dental de mi representado.
              </p>
              <p className="mb-4">
                Declaro que he sido informado(a) sobre los procedimientos a realizar, sus beneficios, riesgos y
                alternativas. Entiendo que la práctica de la odontología no es una ciencia exacta y que no se me han
                garantizado resultados específicos.
              </p>
              <p>
                Asimismo, autorizo el uso de la información clínica y radiográfica con fines de seguimiento del
                tratamiento, docencia e investigación, manteniendo la confidencialidad de los datos personales de
                acuerdo con la normativa mexicana vigente.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los términos y condiciones
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Firma del Tutor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SignaturePad onSave={setSignatureData} />

            {signatureData && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Vista previa de la firma:</p>
                <div className="border rounded-lg p-4 bg-white">
                  <img src={signatureData || "/placeholder.svg"} alt="Firma del tutor" className="max-h-32 mx-auto" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
