"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Fingerprint, RefreshCw } from "lucide-react"

interface FingerprintCaptureProps {
  onCapture: (fingerprintData: string) => void
}

export function FingerprintCapture({ onCapture }: FingerprintCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCaptured, setIsCaptured] = useState(false)
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)

  const startCapture = () => {
    setIsCapturing(true)

    // Simulación de captura de huella
    setTimeout(() => {
      const mockFingerprintData = `fp_${Math.random().toString(36).substring(2, 15)}`
      setFingerprintData(mockFingerprintData)
      setIsCapturing(false)
      setIsCaptured(true)
      onCapture(mockFingerprintData)
    }, 2000)
  }

  const resetCapture = () => {
    setFingerprintData(null)
    setIsCaptured(false)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-muted/30">
      <div className="mb-2 text-center">
        <h3 className="text-base font-semibold mb-1">Captura de Huella Digital</h3>
        <p className="text-xs text-muted-foreground">Coloque la huella digital del tutor para aprobar</p>
      </div>

      <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center mb-3 bg-background">
        {isCapturing ? (
          <div className="animate-pulse">
            <Fingerprint className="h-12 w-12 text-primary" />
          </div>
        ) : isCaptured ? (
          <div className="text-center">
            <Fingerprint className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-xs text-green-500 mt-1">Huella capturada</p>
          </div>
        ) : (
          <Fingerprint className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {!isCaptured ? (
        <Button onClick={startCapture} disabled={isCapturing} className="w-full text-sm py-1 h-8">
          {isCapturing ? "Capturando..." : "Iniciar captura"}
        </Button>
      ) : (
        <Button variant="outline" onClick={resetCapture} className="w-full text-sm py-1 h-8">
          <RefreshCw className="mr-2 h-3 w-3" /> Reintentar
        </Button>
      )}
    </div>
  )
}
