"use client"

import { useState, useEffect } from "react"
import { RadiographUploader, type FileItem, type TagOption } from "@/components/radiograph-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Etiquetas disponibles
const TAG_OPTIONS: TagOption[] = [
  { value: "radiografia", label: "Radiografía" },
  { value: "examen-sangre", label: "Examen de sangre" },
  { value: "receta", label: "Receta médica" },
  { value: "indicaciones", label: "Indicaciones" },
  { value: "informe", label: "Informe odontológico" },
  { value: "otro", label: "Otro" },
]

interface UploaderWrapperProps {
  patientId: string
}

export function UploaderWrapper({ patientId }: UploaderWrapperProps) {
  const [allFiles, setAllFiles] = useState<FileItem[]>([])
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Cargar archivos del paciente desde la API
  const loadPatientFiles = async (patientId: string): Promise<FileItem[]> => {
    try {
      const response = await fetch(`/api/archivos?patientId=${patientId}`)
      if (!response.ok) throw new Error("Error al cargar archivos")
      return await response.json()
    } catch (error) {
      console.error("Error loading patient files:", error)
      throw error
    }
  }

  const saveFileItem = async (file: FileItem & { file?: File }): Promise<void> => {
    try {
      const formData = new FormData()
      if (file.file) formData.append("file", file.file)
      formData.append("patientId", file.patientId)
      if (file.tag) formData.append("tag", file.tag)
      if (file.description) formData.append("description", file.description)

      const response = await fetch('/api/archivos', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        // Lee el mensaje de error del backend
        let errorMsg = "Error al guardar archivo"
        try {
          const errorData = await response.json()
          errorMsg = errorData?.error || errorMsg
          console.error("API error:", errorData)
        } catch (e) {
          // Si no es JSON, ignora
        }
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error("Error saving file:", error)
      throw error
    }
  }

  // Eliminar archivo a través de la API
  const deleteFileItem = async (fileId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/archivos?id=${fileId}&patientId=${patientId}`, { method: 'DELETE' })
      if (!response.ok && response.status !== 404) throw new Error("Error al eliminar archivo")
      // Si es 404, simplemente continúa (el archivo ya no existe)
    } catch (error) {
      console.error("Error deleting file:", error)
      throw error
    }
  }

  // Actualizar etiqueta a través de la API
  const updateFileTag = async (patientId: string, fileId: string, newTag: string): Promise<void> => {
    try {
      const response = await fetch(`/api/archivos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: fileId,
          patientId,
          tag: newTag
        })
      })
      if (!response.ok) throw new Error("Error al actualizar etiqueta")
    } catch (error) {
      console.error("Error updating tag:", error)
      throw error
    }
  }

  // Renombrar archivo a través de la API
  const renameFileItem = async (patientId: string, fileId: string, newName: string): Promise<void> => {
    try {
      const response = await fetch(`/api/archivos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: fileId,
          patientId,
          name: newName
        })
      })
      if (!response.ok) throw new Error("Error al renombrar archivo")
    } catch (error) {
      console.error("Error renaming file:", error)
      throw error
    }
  }

  // Cargar archivos cuando cambia el patientId
  useEffect(() => {
    const fetchPatientFiles = async () => {
      setIsLoading(true)
      try {
        const files = await loadPatientFiles(patientId)
        setAllFiles(files)
      } catch (error) {
        console.error("Error al cargar archivos del paciente:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientFiles()
  }, [patientId])

  const handleFileAdded = async (file: FileItem & { file?: File }) => {
    try {
      // Guardar archivo y obtener respuesta del backend (con id real)
      const formData = new FormData()
      if (file.file) formData.append("file", file.file)
      formData.append("patientId", file.patientId)
      if (file.tag) formData.append("tag", file.tag)
      if (file.description) formData.append("description", file.description)
      const response = await fetch('/api/archivos', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        let errorMsg = "Error al guardar archivo"
        try {
          const errorData = await response.json()
          errorMsg = errorData?.error || errorMsg
          console.error("API error:", errorData)
        } catch (e) {}
        throw new Error(errorMsg)
      }
      const result = await response.json();
      // Recarga la lista completa desde la API
      const files = await loadPatientFiles(patientId)
      setAllFiles(files)
      // Selecciona el archivo recién subido como seleccionado en la vista previa
      const uploaded = files.find(f => f.id === result.file.id)
    } catch (error) {
      console.error("Error al añadir el archivo:", error)
      // No agregues el archivo si falla
    }
  }

  const handleFileRemoved = async (fileId: string) => {
    try {
      setAllFiles((prev) => prev.filter((file) => file.id !== fileId))
      await deleteFileItem(fileId)
    } catch (error) {
      console.error("Error al eliminar el archivo:", error)
      const files = await loadPatientFiles(patientId)
      setAllFiles(files)
    }
  }

  const handleTagUpdate = async (fileId: string, newTag: string) => {
    try {
      setAllFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, tag: newTag } : file)))
      await updateFileTag(patientId, fileId, newTag) // <-- PASA patientId
    } catch (error) {
      console.error("Error al actualizar la etiqueta:", error)
      const files = await loadPatientFiles(patientId)
      setAllFiles(files)
    }
  }

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      setAllFiles((prev) =>
        prev.map((file) => (file.id === fileId ? { ...file, name: newName } : file))
      )
      await renameFileItem(patientId, fileId, newName)
    } catch (error) {
      console.error("Error al renombrar el archivo:", error)
      const files = await loadPatientFiles(patientId)
      setAllFiles(files)
    }
  }

  const getTagLabel = (tagValue: string): string => {
    const tag = TAG_OPTIONS.find((t) => t.value === tagValue)
    return tag ? tag.label : tagValue
  }

  // Filtrar archivos según búsqueda y etiqueta seleccionada
  const filteredFiles = allFiles
    .filter((file) => (tagFilter ? file.tag === tagFilter : true))
    .filter((file) =>
      searchQuery ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)

  return (
    <div className="space-y-6">
      {/* Buscador por etiquetas y nombre */}
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <h2 className="text-lg font-medium mb-4">Buscar documentos</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre de documento..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-64">
            <Select
              value={tagFilter || "all"}
              onValueChange={(value) => setTagFilter(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los documentos</SelectItem>
                {TAG_OPTIONS.map((tag) => (
                  <SelectItem key={tag.value} value={tag.value}>
                    {tag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mostrar resumen de resultados */}
        <div className="mt-4 text-sm text-muted-foreground">
          {isLoading ? (
            <div>Cargando documentos del paciente...</div>
          ) : (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>
                Mostrando {filteredFiles.length} documento(s)
                {tagFilter && (
                  <>
                    {" "}
                    de tipo:
                    <Badge variant="outline" className="ml-2">
                      {getTagLabel(tagFilter)}
                    </Badge>
                  </>
                )}
                {searchQuery && (
                  <>
                    {" "}
                    con nombre que contiene:
                    <Badge variant="outline" className="ml-2">
                      {searchQuery}
                    </Badge>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Componente de carga con archivos filtrados */}
      <RadiographUploader
        title="Documentos Médicos del Paciente"
        onFileAdded={handleFileAdded}
        onFileRemoved={handleFileRemoved}
        onTagUpdate={handleTagUpdate}
        onRenameFile={handleRenameFile}
        tagOptions={TAG_OPTIONS}
        defaultTag="radiografia"
        initialFiles={filteredFiles}
        showFileCount={false}
        patientId={patientId}
      />
    </div>
  )
}