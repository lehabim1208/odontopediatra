"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { storage } from "@/lib/storage"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ToothProps {
  id: string
  position: { top: string; left: string }
  onClick: () => void
  selected: boolean
  type: "primary" | "permanent"
}

const Tooth = ({ id, position, onClick, selected, type }: ToothProps) => {
  return (
    <div
      className={cn(
        "absolute w-12 h-12 flex items-center justify-center cursor-pointer transition-colors",
        selected ? "text-primary" : "text-gray-400",
        type === "primary" ? "text-blue-500" : "text-gray-700",
      )}
      style={{ top: position.top, left: position.left }}
      onClick={onClick}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <path
          d="M20 5 C 10 5, 5 15, 5 25 C 5 35, 15 35, 20 30 C 25 35, 35 35, 35 25 C 35 15, 30 5, 20 5 Z"
          fill={selected ? "#e2f2ff" : "white"}
          stroke={selected ? "#3b82f6" : "#d1d5db"}
          strokeWidth="2"
        />
        <text x="20" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">
          {id}
        </text>
      </svg>
    </div>
  )
}

interface OdontogramaPediatricoProps {
  patientId: string
  readOnly?: boolean
}

export function OdontogramaPediatrico({ patientId, readOnly = false }: OdontogramaPediatricoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)
  const canvas3Ref = useRef<HTMLCanvasElement>(null)
  const canvas4Ref = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const [selectedTreatment, setSelectedTreatment] = useState<string>("caries")
  const [notes, setNotes] = useState<string>("")
  const [savedState, setSavedState] = useState<boolean>(false)

  // Inicializar el canvas
  useEffect(() => {
    if (!canvasRef.current || !canvas2Ref.current || !canvas3Ref.current || !canvas4Ref.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Dibujar el odontograma pediátrico
    drawPediatricOdontogram(ctx)

    // Cargar datos guardados
    loadOdontogramData()
  }, [patientId])

  const drawPediatricOdontogram = (ctx: CanvasRenderingContext2D) => {
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Configuración
    const toothSize = 30
    const spacing = 8
    const startY = 20
    const startY2 = toothSize + 80

    // Dibujar los dientes superiores (5.5, 5.4, 5.3, 5.2, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5)
    const upperTeeth = ["5.5", "5.4", "5.3", "5.2", "5.1", "6.1", "6.2", "6.3", "6.4", "6.5"]
    for (let i = 0; i < upperTeeth.length; i++) {
      const startX = i * toothSize + spacing * i + spacing
      drawToothOutline(ctx, startX, startY, toothSize)

      // Dibujar el número del diente
      ctx.font = "8pt Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "blue"
      ctx.fillText(upperTeeth[i], startX + toothSize / 2, startY / 2 + 5)
    }

    // Dibujar los dientes inferiores (8.5, 8.4, 8.3, 8.2, 8.1, 7.1, 7.2, 7.3, 7.4, 7.5)
    const lowerTeeth = ["8.5", "8.4", "8.3", "8.2", "8.1", "7.1", "7.2", "7.3", "7.4", "7.5"]
    for (let i = 0; i < lowerTeeth.length; i++) {
      const startX = i * toothSize + spacing * i + spacing
      drawToothOutline(ctx, startX, startY2, toothSize)

      // Dibujar el número del diente
      ctx.font = "8pt Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "blue"
      ctx.fillText(lowerTeeth[i], startX + toothSize / 2, startY2 - 10)
    }
  }

  const drawToothOutline = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    // Dibujar un diente pediátrico (más redondeado)
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1

    // Dibujar el contorno del diente
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.stroke()

    // Dibujar las divisiones internas (cruz)
    ctx.beginPath()
    ctx.moveTo(x + size / 2, y)
    ctx.lineTo(x + size / 2, y + size)
    ctx.moveTo(x, y + size / 2)
    ctx.lineTo(x + size, y + size / 2)
    ctx.stroke()
  }

  const loadOdontogramData = () => {
    const savedData = storage.getItem(`pediatric-odontogram-${patientId}`)
    if (savedData) {
      setNotes(savedData.notes || "")
      setSavedState(true)

      // Dibujar los tratamientos guardados
      if (canvas2Ref.current) {
        const ctx = canvas2Ref.current.getContext("2d")
        if (ctx && savedData.treatments) {
          drawSavedTreatments(ctx, savedData.treatments)
        }
      }
    } else {
      setSavedState(false)
    }
  }

  const drawSavedTreatments = (ctx: CanvasRenderingContext2D, treatments: any[]) => {
    // Implementar la lógica para dibujar los tratamientos guardados
    // Esta es una versión simplificada
    treatments.forEach((treatment) => {
      const { toothId, section, type, color } = treatment

      // Dibujar según el tipo de tratamiento
      // ...
    })
  }

  const saveOdontogramData = () => {
    // Guardar los datos del odontograma
    // Esta es una versión simplificada
    storage.setItem(`pediatric-odontogram-${patientId}`, {
      notes,
      treatments: [], // Aquí se guardarían los tratamientos
      lastUpdated: new Date().toISOString(),
    })

    setSavedState(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Odontograma Pediátrico</h2>
          <p className="text-sm text-muted-foreground">Dentición temporal</p>
        </div>

        {!readOnly && (
          <Button onClick={saveOdontogramData} variant="default">
            Guardar Odontograma
          </Button>
        )}
      </div>

      {!readOnly && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <RadioGroup
              defaultValue="caries"
              className="flex flex-wrap gap-4"
              onValueChange={setSelectedTreatment}
              value={selectedTreatment}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="caries" id="caries" />
                <Label htmlFor="caries" className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-red-500"></span>
                  Caries
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="restoration" id="restoration" />
                <Label htmlFor="restoration" className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-blue-500"></span>
                  Restauración
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="extraction" id="extraction" />
                <Label htmlFor="extraction" className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-black"></span>
                  Extracción
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sealant" id="sealant" />
                <Label htmlFor="sealant" className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-green-500"></span>
                  Sellante
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="erase" id="erase" />
                <Label htmlFor="erase" className="flex items-center">
                  <span className="inline-block w-3 h-3 mr-2 rounded-full bg-white border border-gray-300"></span>
                  Borrar
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <div ref={canvasContainerRef} className="relative w-[400px] h-[150px] border border-border rounded-md mx-auto">
        <canvas ref={canvasRef} width="400" height="150" className="absolute left-0 top-0 z-[1]" />
        <canvas ref={canvas2Ref} width="400" height="150" className="absolute left-0 top-0 z-[2]" />
        <canvas ref={canvas3Ref} width="400" height="150" className="absolute left-0 top-0 z-[3]" />
        <canvas ref={canvas4Ref} width="400" height="150" className="absolute left-0 top-0 z-[4]" />
      </div>

      <Tabs defaultValue="notes" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Notas Clínicas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="pt-4">
          <textarea
            className="w-full h-32 p-4 border rounded-md resize-none"
            placeholder="Escriba las notas clínicas aquí..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            readOnly={readOnly}
          />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <div className="border rounded-md p-4 h-32 overflow-y-auto">
            <h3 className="font-semibold mb-2">Historial de cambios</h3>
            {savedState ? (
              <p>Último guardado: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            ) : (
              <p>No hay historial disponible</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
