"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface FilePreviewProps {
  fileType: string
  fileUrl: string
  maxHeight?: number
  zoomLevel?: number
}

export function FilePreview({ fileType, fileUrl, maxHeight = 400, zoomLevel = 100 }: FilePreviewProps) {
  const [loading, setLoading] = useState(true)
  const isPdf = fileType === "application/pdf"
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [fileUrl])

  // Efecto para aplicar zoom a los PDFs
  useEffect(() => {
    if (isPdf && iframeRef.current) {
      try {
        // Intentamos acceder al contenido del iframe para aplicar zoom
        // Esto solo funcionará si el PDF está en el mismo dominio (por razones de seguridad)
        const iframe = iframeRef.current

        // Aplicamos el zoom usando CSS transform
        iframe.style.transform = `scale(${zoomLevel / 100})`
        iframe.style.transformOrigin = "center top"

        // Ajustamos el tamaño del contenedor para compensar el zoom
        const containerHeight = maxHeight * (zoomLevel / 100)
        iframe.style.height = `${containerHeight}px`
      } catch (error) {
        console.error("No se pudo aplicar zoom al PDF:", error)
      }
    }
  }, [isPdf, zoomLevel, maxHeight])

  if (loading) {
    return (
      <Card
        className="w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"
        style={{ height: maxHeight }}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500 dark:text-gray-400">Cargando vista previa...</p>
        </div>
      </Card>
    )
  }

  if (isPdf) {
    return (
      <Card className="w-full overflow-hidden flex items-center justify-center" style={{ height: maxHeight }}>
        <div
          className="w-full h-full overflow-auto"
          style={{
            height: maxHeight,
            maxHeight: maxHeight,
          }}
        >
          <iframe
            ref={iframeRef}
            src={`${fileUrl}#toolbar=0&view=FitH`}
            className="w-full h-full"
            title="PDF Viewer"
            style={{
              transformOrigin: "center top",
              transform: `scale(${zoomLevel / 100})`,
              transition: "transform 0.2s ease-in-out",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/20">
      <img
        src={fileUrl || "/placeholder.svg"}
        alt="Vista previa del documento"
        className="max-w-full object-contain"
        style={{
          maxHeight,
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: "center center",
          transition: "transform 0.2s ease-in-out",
        }}
      />
    </Card>
  )
}
