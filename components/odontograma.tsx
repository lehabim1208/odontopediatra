"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { storage } from "@/lib/storage"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Save, Undo, Redo, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { jsPDF } from "jspdf"

interface OdontogramaProps {
  patientId: string
  patientName?: string
  patientAge?: string | number
  tutor?: string
  readOnly?: boolean
  historicalDate?: string
  defaultDentitionType?: "adult" | "child"
  value?: any
  notas?: string
  onSave?: (json_vector: any, notasValue?: string, historial_cambios?: any[]) => void
}

type Tooth = {
  id: number
  sections: {
    [key: string]: {
      treatment: string
      color: string
      date: string
    } | null
  }
  extraction: boolean
  missing: boolean
}

type Treatment = {
  id: string
  name: string
  color: string
}

type HistoryAction = {
  type: "add" | "remove"
  toothId: number
  section?: string
  treatment?: string
  color?: string
  extraction?: boolean
  missing?: boolean
  bridges?: { from: number; to: number; date: string }[]
}

export function Odontograma({
  patientId,
  patientName,
  patientAge,
  tutor,
  readOnly = false,
  historicalDate,
  defaultDentitionType = "adult",
  value,
  notas: notasProp,
  onSave,
}: OdontogramaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)
  const canvas3Ref = useRef<HTMLCanvasElement>(null)
  const canvas4Ref = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const [selectedTreatment, setSelectedTreatment] = useState<string>("caries")
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [dentitionType, setDentitionType] = useState<"adult" | "child">(defaultDentitionType)
  const [teeth, setTeeth] = useState<{ [key: number]: Tooth }>({})
  const [bridges, setBridges] = useState<{ from: number; to: number; date: string }[]>([])
  const [bridgeStart, setBridgeStart] = useState<number | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [savedState, setSavedState] = useState<boolean>(false)

  // Historial para deshacer/rehacer
  const [history, setHistory] = useState<HistoryAction[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  // Estado para el modal de confirmación
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false)

  const treatments: Treatment[] = [
    { id: "caries", name: "Caries", color: "#FF0000" },
    { id: "restoration", name: "Restauración", color: "#0000FF" },
    { id: "extraction", name: "Extracción", color: "#000000" },
    { id: "missing", name: "Ausente", color: "#663300" },
    { id: "fracture", name: "Fractura", color: "#FFA500" },
    { id: "bridge", name: "Puente", color: "#800080" },
    { id: "sealant", name: "Sellante", color: "#008000" },
    { id: "erase", name: "Borrar", color: "#FFFFFF" },
  ]

  // Actualizar el tipo de dentición cuando cambia el prop defaultDentitionType
  useEffect(() => {
    setDentitionType(defaultDentitionType)
  }, [defaultDentitionType])

  // Inicializar los dientes
  useEffect(() => {
    // Solo inicializar/cargar si NO se está mostrando un vector histórico
    if (!value) {
      initializeTeeth()
      if (historicalDate) {
        loadHistoricalOdontogram(historicalDate)
      } else {
        loadOdontogramData()
      }
    }
  }, [patientId, dentitionType, historicalDate, value])

  // Sincronizar el estado interno con la prop value (usado para cargar odontogramas históricos)
  useEffect(() => {
    if (value && typeof value === "object") {
      if (value.teeth) setTeeth(value.teeth)
      if (value.bridges) setBridges(value.bridges)
      if (value.notes !== undefined) setNotes(value.notes)
      setSavedState(true)
      // Reiniciar historial al cargar un vector externo
      setHistory([])
      setHistoryIndex(-1)
    }
  }, [value])

  // Escuchar el evento para generar el PDF
  useEffect(() => {
    const handleDownloadPDF = (event: Event) => {
      const customEvent = event as CustomEvent
      const { patientName, patientAge, date } = customEvent.detail
      generatePDF(patientName, patientAge, date)
    }

    document.addEventListener("download-odontogram-pdf", handleDownloadPDF)

    return () => {
      document.removeEventListener("download-odontogram-pdf", handleDownloadPDF)
    }
  }, [teeth, bridges, notes, dentitionType])

  const initializeTeeth = () => {
    const newTeeth: { [key: number]: Tooth } = {}

    // Determinar el rango de dientes según el tipo de dentición
    const toothRange =
      dentitionType === "adult" ? [...Array(32)].map((_, i) => i + 1) : [...Array(20)].map((_, i) => i + 1)

    toothRange.forEach((id) => {
      newTeeth[id] = {
        id,
        sections: {
          occlusal: null,
          vestibular: null,
          lingual: null,
          mesial: null,
          distal: null,
        },
        extraction: false,
        missing: false,
      }
    })

    setTeeth(newTeeth)
  }

  const loadOdontogramData = () => {
    const savedData = storage.getItem(`odontogram-${patientId}-${dentitionType}`)
    if (savedData) {
      setTeeth(savedData.teeth || {})
      setBridges(savedData.bridges || [])
      setNotes(savedData.notes || "")
      setSavedState(true)

      // Reiniciar el historial cuando se carga un nuevo odontograma
      setHistory([])
      setHistoryIndex(-1)
    } else {
      setSavedState(false)
    }
  }

  const loadHistoricalOdontogram = (date: string) => {
    const historyData = storage.getItem(`odontogram-history-${patientId}-${dentitionType}`) || []

    if (Array.isArray(historyData)) {
      const odontogramData = historyData.find((item) => item.date === date)

      if (odontogramData) {
        setTeeth(odontogramData.teeth || {})
        setBridges(odontogramData.bridges || [])
        setNotes(odontogramData.notes || "")
        setSavedState(true)
      }
    }
  }

  const saveOdontogramData = async () => {
    const currentDate = new Date().toISOString()
    const odontogramData = {
      teeth,
      bridges,
      notes,
      lastUpdated: currentDate,
    }

    // Guardar en la base de datos vía API
    try {
      const response = await fetch("/api/odontograma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_paciente: patientId,
          fecha_hora: currentDate,
          notas: notes,
          json_vector: odontogramData,
          historial_cambios: history,
        }),
      })
      const result = await response.json()
      if (result.success) {
        setSavedState(true)
        toast({
          title: "Éxito",
          description: "Odontograma guardado en la base de datos",
          variant: "success",
          duration: 2500,
        })
        if (onSave) onSave(odontogramData, notes, history)
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el odontograma",
          variant: "destructive",
          duration: 2500,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el odontograma",
        variant: "destructive",
        duration: 2500,
      })
    }
  }

  useEffect(() => {
    if (!canvasRef.current || !canvas2Ref.current || !canvas3Ref.current || !canvas4Ref.current) return

    const ctx = canvasRef.current.getContext("2d")
    const ctx2 = canvas2Ref.current.getContext("2d")
    const ctx3 = canvas3Ref.current.getContext("2d")
    const ctx4 = canvas4Ref.current.getContext("2d")

    if (!ctx || !ctx2 || !ctx3 || !ctx4) return

    // Limpiar todos los canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx2.clearRect(0, 0, canvas2Ref.current.width, canvas2Ref.current.height)
    ctx3.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
    ctx4.clearRect(0, 0, canvas4Ref.current.width, canvas4Ref.current.height)

    // Dibujar el odontograma base
    drawOdontogram(ctx)

    // Dibujar los tratamientos guardados
    drawSavedTreatments(ctx2)

    // Dibujar los puentes
    drawBridges(ctx4)
  }, [teeth, bridges, dentitionType, selectedTooth, selectedSection])

  const drawOdontogram = (ctx: CanvasRenderingContext2D) => {
    const toothSize = 40
    const spacing = 10
    const startY = 20
    const startY2 = toothSize + 100

    // Determinar el número de dientes por arco según el tipo de dentición
    const teethPerArch = dentitionType === "adult" ? 16 : 10

    // Dibujar los dientes superiores (1-16 para adultos, 1-10 para niños)
    for (let i = 0; i < teethPerArch; i++) {
      const toothId = i + 1
      const startX = i * toothSize + spacing * i + spacing
      drawToothOutline(ctx, startX, startY, toothSize)

      // Dibujar el número del diente
      ctx.font = "10pt Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "blue"
      ctx.fillText(toothId.toString(), startX + toothSize / 2, startY / 2 + 5)
    }

    // Dibujar los dientes inferiores (17-32 para adultos, 11-20 para niños)
    for (let i = 0; i < teethPerArch; i++) {
      const toothId = i + 1 + teethPerArch
      const startX = i * toothSize + spacing * i + spacing
      drawToothOutline(ctx, startX, startY2, toothSize)

      // Dibujar el número del diente
      ctx.font = "10pt Arial"
      ctx.textAlign = "center"
      ctx.fillStyle = "blue"
      ctx.fillText(toothId.toString(), startX + toothSize / 2, startY2 - 10)
    }
  }

  const drawToothOutline = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const quarter = size / 4
    const threeQuarters = quarter * 3

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1

    // Sección oclusal (centro)
    ctx.beginPath()
    ctx.moveTo(x + quarter, y + quarter)
    ctx.lineTo(x + threeQuarters, y + quarter)
    ctx.lineTo(x + threeQuarters, y + threeQuarters)
    ctx.lineTo(x + quarter, y + threeQuarters)
    ctx.closePath()
    ctx.stroke()

    // Sección vestibular (arriba)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + size, y)
    ctx.lineTo(x + threeQuarters, y + quarter)
    ctx.lineTo(x + quarter, y + quarter)
    ctx.closePath()
    ctx.stroke()

    // Sección mesial (derecha)
    ctx.beginPath()
    ctx.moveTo(x + size, y)
    ctx.lineTo(x + size, y + size)
    ctx.lineTo(x + threeQuarters, y + threeQuarters)
    ctx.lineTo(x + threeQuarters, y + quarter)
    ctx.closePath()
    ctx.stroke()

    // Sección distal (izquierda)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x + quarter, y + threeQuarters)
    ctx.lineTo(x + quarter, y + quarter)
    ctx.closePath()
    ctx.stroke()

    // Sección lingual (abajo)
    ctx.beginPath()
    ctx.moveTo(x, y + size)
    ctx.lineTo(x + size, y + size)
    ctx.lineTo(x + threeQuarters, y + threeQuarters)
    ctx.lineTo(x + quarter, y + threeQuarters)
    ctx.closePath()
    ctx.stroke()
  }

  const drawSavedTreatments = (ctx: CanvasRenderingContext2D) => {
    Object.values(teeth).forEach((tooth) => {
      // Dibujar secciones con tratamientos
      Object.entries(tooth.sections).forEach(([section, treatment]) => {
        if (treatment) {
          fillToothSection(ctx, tooth.id, section, treatment.color)
        }
      })

      // Dibujar extracciones
      if (tooth.extraction) {
        markExtraction(ctx, tooth.id)
      }

      // Dibujar dientes ausentes
      if (tooth.missing) {
        markMissing(ctx, tooth.id)
      }
    })
  }

  const drawBridges = (ctx: CanvasRenderingContext2D) => {
    bridges.forEach((bridge) => {
      drawBridge(ctx, bridge.from, bridge.to)
    })
  }

  const fillToothSection = (ctx: CanvasRenderingContext2D, toothId: number, section: string, color: string) => {
    const toothSize = 40
    const spacing = 10
    const startY = toothId > (dentitionType === "adult" ? 16 : 10) ? toothSize + 100 : 20

    let adjustedToothId = toothId
    if (toothId > (dentitionType === "adult" ? 16 : 10)) {
      adjustedToothId = toothId - (dentitionType === "adult" ? 16 : 10)
    }

    const startX = (adjustedToothId - 1) * toothSize + spacing * (adjustedToothId - 1) + spacing
    const quarter = toothSize / 4
    const threeQuarters = quarter * 3

    ctx.fillStyle = color

    switch (section) {
      case "occlusal":
        ctx.beginPath()
        ctx.moveTo(startX + quarter, startY + quarter)
        ctx.lineTo(startX + threeQuarters, startY + quarter)
        ctx.lineTo(startX + threeQuarters, startY + threeQuarters)
        ctx.lineTo(startX + quarter, startY + threeQuarters)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "vestibular":
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX + toothSize, startY)
        ctx.lineTo(startX + threeQuarters, startY + quarter)
        ctx.lineTo(startX + quarter, startY + quarter)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "mesial":
        ctx.beginPath()
        ctx.moveTo(startX + toothSize, startY)
        ctx.lineTo(startX + toothSize, startY + toothSize)
        ctx.lineTo(startX + threeQuarters, startY + threeQuarters)
        ctx.lineTo(startX + threeQuarters, startY + quarter)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "distal":
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX, startY + toothSize)
        ctx.lineTo(startX + quarter, startY + threeQuarters)
        ctx.lineTo(startX + quarter, startY + quarter)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "lingual":
        ctx.beginPath()
        ctx.moveTo(startX, startY + toothSize)
        ctx.lineTo(startX + toothSize, startY + toothSize)
        ctx.lineTo(startX + threeQuarters, startY + threeQuarters)
        ctx.lineTo(startX + quarter, startY + threeQuarters)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
    }
  }

  const markExtraction = (ctx: CanvasRenderingContext2D, toothId: number) => {
    const toothSize = 40
    const spacing = 10
    const startY = toothId > (dentitionType === "adult" ? 16 : 10) ? toothSize + 100 : 20

    let adjustedToothId = toothId
    if (toothId > (dentitionType === "adult" ? 16 : 10)) {
      adjustedToothId = toothId - (dentitionType === "adult" ? 16 : 10)
    }

    const startX = (adjustedToothId - 1) * toothSize + spacing * (adjustedToothId - 1) + spacing

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 3

    // Dibujar una X
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(startX + toothSize, startY + toothSize)
    ctx.moveTo(startX + toothSize, startY)
    ctx.lineTo(startX, startY + toothSize)
    ctx.stroke()

    ctx.lineWidth = 1
  }

  const markMissing = (ctx: CanvasRenderingContext2D, toothId: number) => {
    const toothSize = 40
    const spacing = 10
    const startY = toothId > (dentitionType === "adult" ? 16 : 10) ? toothSize + 100 : 20

    let adjustedToothId = toothId
    if (toothId > (dentitionType === "adult" ? 16 : 10)) {
      adjustedToothId = toothId - (dentitionType === "adult" ? 16 : 10)
    }

    const startX = (adjustedToothId - 1) * toothSize + spacing * (adjustedToothId - 1) + spacing

    // Dibujar un círculo con una línea diagonal
    ctx.strokeStyle = "#663300"
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.arc(startX + toothSize / 2, startY + toothSize / 2, toothSize / 2 - 5, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(startX + 5, startY + 5)
    ctx.lineTo(startX + toothSize - 5, startY + toothSize - 5)
    ctx.stroke()

    ctx.lineWidth = 1
  }

  const drawBridge = (ctx: CanvasRenderingContext2D, fromTooth: number, toTooth: number) => {
    const toothSize = 40
    const spacing = 10

    // Verificar que los dientes estén en el mismo arco
    const isUpperArch1 = fromTooth <= (dentitionType === "adult" ? 16 : 10)
    const isUpperArch2 = toTooth <= (dentitionType === "adult" ? 16 : 10)

    if (isUpperArch1 !== isUpperArch2) return

    const startY = isUpperArch1 ? toothSize + 10 : toothSize + 150

    let adjustedFromTooth = fromTooth
    let adjustedToTooth = toTooth

    if (!isUpperArch1) {
      adjustedFromTooth = fromTooth - (dentitionType === "adult" ? 16 : 10)
      adjustedToTooth = toTooth - (dentitionType === "adult" ? 16 : 10)
    }

    // Asegurarse de que fromTooth sea menor que toTooth
    if (adjustedFromTooth > adjustedToTooth) {
      ;[adjustedFromTooth, adjustedToTooth] = [adjustedToTooth, adjustedFromTooth]
    }

    const startX = (adjustedFromTooth - 1) * toothSize + spacing * (adjustedFromTooth - 1) + spacing + toothSize / 2
    const endX = (adjustedToTooth - 1) * toothSize + spacing * (adjustedToTooth - 1) + spacing + toothSize / 2

    ctx.strokeStyle = "#800080"
    ctx.lineWidth = 3

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, startY)
    ctx.stroke()

    ctx.lineWidth = 1
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return

    const rect = canvasContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const toothInfo = getToothFromCoordinates(x, y)

    if (!toothInfo) return

    const { toothId, section } = toothInfo

    // Si estamos en modo puente
    if (selectedTreatment === "bridge") {
      handleBridgeSelection(toothId)
      return
    }

    // Si estamos en modo extracción o ausente, no necesitamos sección
    if (selectedTreatment === "extraction") {
      handleExtractionSelection(toothId)
      return
    }

    if (selectedTreatment === "missing") {
      handleMissingSelection(toothId)
      return
    }

    // Para otros tratamientos, necesitamos tanto diente como sección
    if (toothId && section) {
      handleTreatmentSelection(toothId, section)
    }
  }

  const handleBridgeSelection = (toothId: number) => {
    if (bridgeStart === null) {
      setBridgeStart(toothId)

      // Resaltar el diente seleccionado
      if (canvas3Ref.current) {
        const ctx = canvas3Ref.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
          highlightTooth(ctx, toothId)
        }
      }
    } else {
      // Verificar que los dientes estén en el mismo arco
      const isUpperArch1 = bridgeStart <= (dentitionType === "adult" ? 16 : 10)
      const isUpperArch2 = toothId <= (dentitionType === "adult" ? 16 : 10)

      if (isUpperArch1 !== isUpperArch2) {
        toast({
          title: "Error",
          description: "Los dientes del puente deben estar en el mismo arco",
          variant: "destructive",
          duration: 2500,
        })
        setBridgeStart(null)

        // Limpiar el resaltado
        if (canvas3Ref.current) {
          const ctx = canvas3Ref.current.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
          }
        }
        return
      }

      // Crear el puente
      const newBridge = {
        from: Math.min(bridgeStart, toothId),
        to: Math.max(bridgeStart, toothId),
        date: new Date().toISOString(),
      }

      // Guardar en el historial
      const newAction: HistoryAction = {
        type: "add",
        toothId: 0, // No aplica para puentes
        bridges: [...bridges, newBridge],
      }

      addToHistory(newAction)

      setBridges([...bridges, newBridge])
      setBridgeStart(null)

      // Limpiar el resaltado
      if (canvas3Ref.current) {
        const ctx = canvas3Ref.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
        }
      }
    }
  }

  const handleExtractionSelection = (toothId: number) => {
    setTeeth((prev) => {
      const updatedTeeth = { ...prev }

      if (updatedTeeth[toothId]) {
        const newExtractionValue = !updatedTeeth[toothId].extraction

        // Guardar en el historial
        const newAction: HistoryAction = {
          type: newExtractionValue ? "add" : "remove",
          toothId,
          extraction: newExtractionValue,
        }

        addToHistory(newAction)

        updatedTeeth[toothId] = {
          ...updatedTeeth[toothId],
          extraction: newExtractionValue,
        }
      }

      return updatedTeeth
    })
  }

  const handleMissingSelection = (toothId: number) => {
    setTeeth((prev) => {
      const updatedTeeth = { ...prev }

      if (updatedTeeth[toothId]) {
        const newMissingValue = !updatedTeeth[toothId].missing

        // Guardar en el historial
        const newAction: HistoryAction = {
          type: newMissingValue ? "add" : "remove",
          toothId,
          missing: newMissingValue,
        }

        addToHistory(newAction)

        updatedTeeth[toothId] = {
          ...updatedTeeth[toothId],
          missing: newMissingValue,
        }
      }

      return updatedTeeth
    })
  }

  const handleTreatmentSelection = (toothId: number, section: string) => {
    if (selectedTreatment === "erase") {
      // Borrar el tratamiento de la sección
      setTeeth((prev) => {
        const updatedTeeth = { ...prev }

        if (updatedTeeth[toothId] && updatedTeeth[toothId].sections[section]) {
          // Guardar en el historial
          const newAction: HistoryAction = {
            type: "remove",
            toothId,
            section,
          }

          addToHistory(newAction)

          updatedTeeth[toothId] = {
            ...updatedTeeth[toothId],
            sections: {
              ...updatedTeeth[toothId].sections,
              [section]: null,
            },
          }
        }

        return updatedTeeth
      })
    } else {
      // Aplicar el tratamiento seleccionado
      const treatment = treatments.find((t) => t.id === selectedTreatment)

      if (!treatment) return

      setTeeth((prev) => {
        const updatedTeeth = { ...prev }

        if (updatedTeeth[toothId]) {
          // Guardar en el historial
          const newAction: HistoryAction = {
            type: "add",
            toothId,
            section,
            treatment: treatment.id,
            color: treatment.color,
          }

          addToHistory(newAction)

          updatedTeeth[toothId] = {
            ...updatedTeeth[toothId],
            sections: {
              ...updatedTeeth[toothId].sections,
              [section]: {
                treatment: treatment.id,
                color: treatment.color,
                date: new Date().toISOString(),
              },
            },
          }
        }

        return updatedTeeth
      })
    }
  }

  const addToHistory = (action: HistoryAction) => {
    // Si estamos en un punto intermedio del historial, eliminar las acciones futuras
    if (historyIndex < history.length - 1) {
      setHistory((prev) => prev.slice(0, historyIndex + 1))
    }

    setHistory((prev) => [...prev, action])
    setHistoryIndex((prev) => prev + 1)
  }

  const handleUndo = () => {
    if (historyIndex < 0) return

    const action = history[historyIndex]

    // Revertir la acción
    if (action.type === "add") {
      if (action.bridges) {
        // Revertir la adición de un puente
        setBridges((prev) => prev.slice(0, -1))
      } else if (action.extraction !== undefined) {
        // Revertir la extracción
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              extraction: false,
            }
          }

          return updatedTeeth
        })
      } else if (action.missing !== undefined) {
        // Revertir el diente ausente
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              missing: false,
            }
          }

          return updatedTeeth
        })
      } else if (action.section && action.treatment) {
        // Revertir la adición de un tratamiento
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              sections: {
                ...updatedTeeth[action.toothId].sections,
                [action.section!]: null,
              },
            }
          }

          return updatedTeeth
        })
      }
    } else if (action.type === "remove") {
      if (action.section) {
        // Revertir la eliminación de un tratamiento
        // Necesitaríamos guardar el tratamiento original en el historial
        // Por simplicidad, solo restauramos un valor por defecto
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              sections: {
                ...updatedTeeth[action.toothId].sections,
                [action.section!]: {
                  treatment: action.treatment || "caries",
                  color: action.color || "#FF0000",
                  date: new Date().toISOString(),
                },
              },
            }
          }

          return updatedTeeth
        })
      } else if (action.extraction !== undefined) {
        // Revertir la eliminación de una extracción
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              extraction: true,
            }
          }

          return updatedTeeth
        })
      } else if (action.missing !== undefined) {
        // Revertir la eliminación de un diente ausente
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              missing: true,
            }
          }

          return updatedTeeth
        })
      }
    }

    setHistoryIndex((prev) => prev - 1)
  }

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return

    const action = history[historyIndex + 1]

    // Rehacer la acción
    if (action.type === "add") {
      if (action.bridges) {
        // Rehacer la adición de un puente
        setBridges(action.bridges)
      } else if (action.extraction !== undefined) {
        // Rehacer la extracción
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              extraction: true,
            }
          }

          return updatedTeeth
        })
      } else if (action.missing !== undefined) {
        // Rehacer el diente ausente
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              missing: true,
            }
          }

          return updatedTeeth
        })
      } else if (action.section && action.treatment) {
        // Rehacer la adición de un tratamiento
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              sections: {
                ...updatedTeeth[action.toothId].sections,
                [action.section!]: {
                  treatment: action.treatment!,
                  color: action.color!,
                  date: new Date().toISOString(),
                },
              },
            }
          }

          return updatedTeeth
        })
      }
    } else if (action.type === "remove") {
      if (action.section) {
        // Rehacer la eliminación de un tratamiento
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              sections: {
                ...updatedTeeth[action.toothId].sections,
                [action.section!]: null,
              },
            }
          }

          return updatedTeeth
        })
      } else if (action.extraction !== undefined) {
        // Rehacer la eliminación de una extracción
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              extraction: false,
            }
          }

          return updatedTeeth
        })
      } else if (action.missing !== undefined) {
        // Rehacer la eliminación de un diente ausente
        setTeeth((prev) => {
          const updatedTeeth = { ...prev }

          if (updatedTeeth[action.toothId]) {
            updatedTeeth[action.toothId] = {
              ...updatedTeeth[action.toothId],
              missing: false,
            }
          }

          return updatedTeeth
        })
      }
    }

    setHistoryIndex((prev) => prev + 1)
  }

  const handleClearOdontogram = () => {
    if (readOnly) return

    // Mostrar el modal de confirmación en lugar de un alert
    setShowClearConfirmDialog(true)
  }

  const confirmClearOdontogram = () => {
    initializeTeeth()
    setBridges([])

    // Reiniciar el historial
    setHistory([])
    setHistoryIndex(-1)

    // Cerrar el modal
    setShowClearConfirmDialog(false)

    toast({
      title: "Éxito",
      description: "Odontograma limpiado correctamente",
      variant: "success",
      duration: 2500,
    })
  }

  const getToothFromCoordinates = (x: number, y: number) => {
    const toothSize = 40
    const spacing = 10
    const teethPerArch = dentitionType === "adult" ? 16 : 10

    // Verificar si está en el arco superior
    if (y >= 20 && y <= 20 + toothSize) {
      for (let i = 0; i < teethPerArch; i++) {
        const startX = i * toothSize + spacing * i + spacing

        if (x >= startX && x <= startX + toothSize) {
          const toothId = i + 1
          const section = getToothSection(x - startX, y - 20, toothSize)
          return { toothId, section }
        }
      }
    }

    // Verificar si está en el arco inferior
    const startY2 = toothSize + 100
    if (y >= startY2 && y <= startY2 + toothSize) {
      for (let i = 0; i < teethPerArch; i++) {
        const startX = i * toothSize + spacing * i + spacing

        if (x >= startX && x <= startX + toothSize) {
          const toothId = i + 1 + teethPerArch
          const section = getToothSection(x - startX, y - startY2, toothSize)
          return { toothId, section }
        }
      }
    }

    return null
  }

  const getToothSection = (relativeX: number, relativeY: number, size: number) => {
    const quarter = size / 4
    const threeQuarters = quarter * 3

    // Sección oclusal (centro)
    if (relativeX >= quarter && relativeX <= threeQuarters && relativeY >= quarter && relativeY <= threeQuarters) {
      return "occlusal"
    }

    // Sección vestibular (arriba)
    if (relativeY < quarter) {
      return "vestibular"
    }

    // Sección lingual (abajo)
    if (relativeY > threeQuarters) {
      return "lingual"
    }

    // Sección mesial (derecha)
    if (relativeX > threeQuarters) {
      return "mesial"
    }

    // Sección distal (izquierda)
    if (relativeX < quarter) {
      return "distal"
    }

    return "occlusal" // Por defecto
  }

  const highlightTooth = (ctx: CanvasRenderingContext2D, toothId: number) => {
    const toothSize = 40
    const spacing = 10
    const startY = toothId > (dentitionType === "adult" ? 16 : 10) ? toothSize + 100 : 20

    let adjustedToothId = toothId
    if (toothId > (dentitionType === "adult" ? 16 : 10)) {
      adjustedToothId = toothId - (dentitionType === "adult" ? 16 : 10)
    }

    const startX = (adjustedToothId - 1) * toothSize + spacing * (adjustedToothId - 1) + spacing

    ctx.strokeStyle = "#FFFF00"
    ctx.lineWidth = 2

    ctx.strokeRect(startX, startY, toothSize, toothSize)

    ctx.lineWidth = 1
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return

    const rect = canvasContainerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const toothInfo = getToothFromCoordinates(x, y)

    if (!canvas3Ref.current) return
    const ctx = canvas3Ref.current.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas de resaltado
    ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)

    // Si estamos en modo puente y ya tenemos un diente seleccionado
    if (selectedTreatment === "bridge" && bridgeStart !== null) {
      highlightTooth(ctx, bridgeStart)
    }

    if (!toothInfo) return

    const { toothId, section } = toothInfo

    setSelectedTooth(toothId)
    setSelectedSection(section)

    // Resaltar el diente o sección según el tratamiento seleccionado
    if (selectedTreatment === "bridge" || selectedTreatment === "extraction" || selectedTreatment === "missing") {
      highlightTooth(ctx, toothId)
    } else {
      highlightToothSection(ctx, toothId, section)
    }
  }

  const highlightToothSection = (ctx: CanvasRenderingContext2D, toothId: number, section: string) => {
    const toothSize = 40
    const spacing = 10
    const startY = toothId > (dentitionType === "adult" ? 16 : 10) ? toothSize + 100 : 20

    let adjustedToothId = toothId
    if (toothId > (dentitionType === "adult" ? 16 : 10)) {
      adjustedToothId = toothId - (dentitionType === "adult" ? 16 : 10)
    }

    const startX = (adjustedToothId - 1) * toothSize + spacing * (adjustedToothId - 1) + spacing
    const quarter = toothSize / 4
    const threeQuarters = quarter * 3

    ctx.strokeStyle = "#FFFF00"
    ctx.lineWidth = 2

    switch (section) {
      case "occlusal":
        ctx.strokeRect(startX + quarter, startY + quarter, toothSize / 2, toothSize / 2)
        break
      case "vestibular":
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX + toothSize, startY)
        ctx.lineTo(startX + threeQuarters, startY + quarter)
        ctx.lineTo(startX + quarter, startY + quarter)
        ctx.closePath()
        ctx.stroke()
        break
      case "mesial":
        ctx.beginPath()
        ctx.moveTo(startX + toothSize, startY)
        ctx.lineTo(startX + toothSize, startY + toothSize)
        ctx.lineTo(startX + threeQuarters, startY + threeQuarters)
        ctx.lineTo(startX + threeQuarters, startY + quarter)
        ctx.closePath()
        ctx.stroke()
        break
      case "distal":
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX, startY + toothSize)
        ctx.lineTo(startX + quarter, startY + threeQuarters)
        ctx.lineTo(startX + quarter, startY + quarter)
        ctx.closePath()
        ctx.stroke()
        break
      case "lingual":
        ctx.beginPath()
        ctx.moveTo(startX, startY + toothSize)
        ctx.lineTo(startX + toothSize, startY + toothSize)
        ctx.lineTo(startX + threeQuarters, startY + threeQuarters)
        ctx.lineTo(startX + quarter, startY + threeQuarters)
        ctx.closePath()
        ctx.stroke()
        break
    }

    ctx.lineWidth = 1
  }

  const handleMouseLeave = () => {
    setSelectedTooth(null)
    setSelectedSection(null)

    if (!canvas3Ref.current) return
    const ctx = canvas3Ref.current.getContext("2d")
    if (!ctx) return

    // Mantener el resaltado del diente inicial del puente si está seleccionado
    if (selectedTreatment === "bridge" && bridgeStart !== null) {
      ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
      highlightTooth(ctx, bridgeStart)
    } else {
      ctx.clearRect(0, 0, canvas3Ref.current.width, canvas3Ref.current.height)
    }
  }

  // Función para generar el PDF del odontograma
  const generatePDF = (patientName: string, patientAge: number, date: string) => {
    if (!canvasRef.current || !canvas2Ref.current || !canvas4Ref.current) return

    // Crear un canvas temporal para combinar todos los canvas
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvasRef.current.width
    tempCanvas.height = canvasRef.current.height
    const tempCtx = tempCanvas.getContext("2d")

    if (!tempCtx) return

    // Dibujar todos los canvas en el canvas temporal
    tempCtx.drawImage(canvasRef.current, 0, 0)
    tempCtx.drawImage(canvas2Ref.current, 0, 0)
    tempCtx.drawImage(canvas4Ref.current, 0, 0)

    // Convertir el canvas a imagen
    const imgData = tempCanvas.toDataURL("image/png")

    // Crear el PDF en orientación horizontal
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Proporción original: 5906 x 2165
    const logoWidth = 50
    const logoHeight = (2165 / 5906) * logoWidth
    pdf.addImage('/images/logo-emmanuel-severino.png', 'PNG', 15, 5, logoWidth, logoHeight)

    // Añadir título debajo del logo
    pdf.setFontSize(18)
    pdf.setTextColor(0, 0, 255) // Azul
    pdf.text('Odontograma Digital', 15, 5 + logoHeight + 8)

    // Ajustar la información del paciente para que baje
    let infoY = 5 + logoHeight + 8 + 10
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0) // Negro
    pdf.text(`Paciente: ${patientName}`, 15, infoY)
    pdf.text(`Edad: ${patientAge} años`, 15, infoY + 7)
    pdf.text(`Fecha: ${date} ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`, 15, infoY + 14)
    pdf.text(`Tipo de dentición: ${dentitionType === "adult" ? "Adulto" : "Infantil"}`, 15, infoY + 21)
    if (tutor) {
      pdf.text(`Tutor: ${tutor}`, 15, infoY + 28)
    }

    // Añadir leyenda (guía de colores) a la derecha de la información del paciente, en columnas de 3 y sin el de "Borrar"
    pdf.setFontSize(14)
    pdf.text("Guía de colores", 150, 20)
    const filteredTreatments = treatments.filter(t => t.id !== "erase")
    const colCount = 3
    const colWidth = 50
    filteredTreatments.forEach((treatment, index) => {
      const col = Math.floor(index / colCount)
      const row = index % colCount
      const x = 150 + col * colWidth
      const y = 27 + row * 7
      pdf.setFillColor(treatment.color)
      pdf.rect(x, y, 5, 5, "F")
      pdf.setFontSize(10)
      pdf.text(treatment.name, x + 10, y + 4)
    })

    // Añadir la imagen del odontograma (más grande y en un recuadro)
    const odontogramaImgY = infoY + 21 + 18 // Más espacio
    const odontogramaImgWidth = 250
    const odontogramaImgHeight = 70
    const boxPadding = 8
    const boxX = 12
    const boxY = odontogramaImgY - boxPadding
    const boxWidth = odontogramaImgWidth + boxPadding * 2
    const boxHeight = odontogramaImgHeight + boxPadding * 2
    // Imagen centrada en el recuadro
    pdf.addImage(imgData, "PNG", boxX + boxPadding, boxY + boxPadding, odontogramaImgWidth, odontogramaImgHeight)

    // Añadir las notas
    pdf.setFontSize(14)
    pdf.text("Notas Clínicas:", 15, boxY + boxHeight + 10)
    pdf.setFontSize(10)
    const splitNotes = pdf.splitTextToSize(notes || "Sin notas clínicas", 270)
    pdf.text(splitNotes, 15, boxY + boxHeight + 17)

    // Guardar el PDF
    pdf.save(`Odontograma_${patientName.replace(/\s+/g, "_")}.pdf`)

    // Avisar que terminó la generación del PDF
    document.dispatchEvent(new CustomEvent("odontogram-pdf-done"))

    toast({
      title: "Éxito",
      description: "PDF del odontograma generado correctamente",
      variant: "success",
      duration: 2500,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {selectedTooth && selectedSection && (
            <p className="text-sm text-muted-foreground">
              Diente: {selectedTooth}, Sección: {selectedSection}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <div className="flex gap-2">
              <Button onClick={handleUndo} variant="outline" disabled={historyIndex < 0} title="Deshacer">
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                variant="outline"
                disabled={historyIndex >= history.length - 1}
                title="Rehacer"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button onClick={handleClearOdontogram} variant="outline" title="Limpiar odontograma">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={saveOdontogramData} variant="default">
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </div>
          )}
        </div>
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
              {treatments.map((treatment) => (
                <div key={treatment.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={treatment.id} id={treatment.id} />
                  <Label htmlFor={treatment.id} className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: treatment.color }}
                    ></span>
                    {treatment.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <div ref={canvasContainerRef} className="relative w-[810px] h-[200px] border border-border rounded-md mx-auto">
        <canvas ref={canvasRef} width="810" height="200" className="absolute left-0 top-0 z-[1]" />
        <canvas ref={canvas2Ref} width="810" height="200" className="absolute left-0 top-0 z-[2]" />
        <canvas ref={canvas3Ref} className="absolute left-0 top-0 z-[2]" />
        <canvas
          ref={canvas3Ref}
          width="810"
          height="200"
          className="absolute left-0 top-0 z-[3]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        <canvas
          ref={canvas4Ref}
          width="810"
          height="200"
          className="absolute left-0 top-0 z-[4]"
          onClick={handleCanvasClick}
        />
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
            <ul className="space-y-1 text-sm">
              {savedState ? (
                <>
                  {Object.values(teeth).flatMap((tooth) =>
                    Object.entries(tooth.sections)
                      .filter(([_, treatment]) => treatment !== null)
                      .map(([section, treatment]) => {
                        if (!treatment) return null
                        const treatmentName =
                          treatments.find((t) => t.id === treatment.treatment)?.name || treatment.treatment
                        return (
                          <li key={`${tooth.id}-${section}-${treatment.date}`}>
                            {format(new Date(treatment.date), "dd/MM/yyyy HH:mm", { locale: es })} - Diente {tooth.id},
                            Sección {section}: {treatmentName}
                          </li>
                        )
                      }),
                  )}
                  {/* Registrar extracciones en el historial */}
                  {Object.values(teeth)
                    .filter((tooth) => tooth.extraction)
                    .map((tooth) => (
                      <li key={`extraction-${tooth.id}`}>
                        {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })} - Diente {tooth.id}: Extracción
                      </li>
                    ))}
                  {/* Registrar dientes ausentes en el historial */}
                  {Object.values(teeth)
                    .filter((tooth) => tooth.missing)
                    .map((tooth) => (
                      <li key={`missing-${tooth.id}`}>
                        {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })} - Diente {tooth.id}: Ausente
                      </li>
                    ))}
                  {bridges.map((bridge, index) => (
                    <li key={`bridge-${index}`}>
                      {format(new Date(bridge.date), "dd/MM/yyyy HH:mm", { locale: es })} - Puente entre dientes{" "}
                      {bridge.from} y {bridge.to}
                    </li>
                  ))}
                </>
              ) : (
                <li>No hay historial disponible</li>
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de confirmación para limpiar el odontograma */}
      <Dialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea limpiar todo el odontograma? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowClearConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmClearOdontogram}>
              Limpiar odontograma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
