"use client"

import { useState, useEffect } from "react"
import { RadiographUploader, type FileItem, type TagOption } from "@/components/radiograph-uploader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  loadPatientFiles,
  saveFileItem,
  deleteFileItem,
  updateFileTag,
  renameFileItem,
} from "@/components/radiograph-uploader/storage-service"

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
  loadPatientFiles?: (patientId: string) => Promise<FileItem[]>
  savePatientFile?: (file: FileItem) => Promise<void>
  deletePatientFile?: (fileId: string) => Promise<void>
  updateFileTag?: (patientId: string, fileId: string, newTag: string) => Promise<void>
  renameFile?: (patientId: string, fileId: string, newName: string) => Promise<void>
}

export function UploaderWrapper({
  patientId,
  loadPatientFiles: externalLoadPatientFiles,
  savePatientFile: externalSavePatientFile,
  deletePatientFile: externalDeletePatientFile,
  updateFileTag: externalUpdateFileTag,
  renameFile: externalRenameFile,
}: UploaderWrapperProps) {
  // state para almacenar todos los archivos
  const [allFiles, setAllFiles] = useState<FileItem[]>([])

  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [isLoading, setIsLoading] = useState(false)

  // Cargar archivos cuando cambia su id
  useEffect(() => {
    const fetchPatientFiles = async () => {
      setIsLoading(true)
      try {
        const loadFunction = externalLoadPatientFiles || loadPatientFiles
        const files = await loadFunction(patientId)
        setAllFiles(files)
      } catch (error) {
        console.error("Error al cargar archivos del paciente:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientFiles()
  }, [patientId, externalLoadPatientFiles])

  const handleFileAdded = async (file: FileItem) => {
    try {
      setAllFiles((prev) => [file, ...prev])

      const saveFunction = externalSavePatientFile || saveFileItem
      await saveFunction(file)
    } catch (error) {
      console.error("Error al añadir el archivo:", error)
      setAllFiles((prev) => prev.filter((f) => f.id !== file.id))
    }
  }

  const handleFileRemoved = async (fileId: string) => {
    try {
      setAllFiles((prev) => prev.filter((file) => file.id !== fileId))

      const deleteFunction = externalDeletePatientFile || ((id: string) => deleteFileItem(patientId, id))
      await deleteFunction(fileId)
    } catch (error) {
      console.error("Error al eliminar el archivo:", error)
      const loadFunction = externalLoadPatientFiles || loadPatientFiles
      const files = await loadFunction(patientId)
      setAllFiles(files)
    }
  }

  const handleTagUpdate = async (fileId: string, newTag: string) => {
    try {
      setAllFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, tag: newTag } : file)))

      const updateFunction = externalUpdateFileTag || updateFileTag
      await updateFunction(patientId, fileId, newTag)
    } catch (error) {
      console.error("Error al actualizar la etiqueta:", error)
      const loadFunction = externalLoadPatientFiles || loadPatientFiles
      const files = await loadFunction(patientId)
      setAllFiles(files)
    }
  }

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      setAllFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, name: newName } : file)))

      const renameFunction = externalRenameFile || renameFileItem
      await renameFunction(patientId, fileId, newName)
    } catch (error) {
      console.error("Error al renombrar el archivo:", error)
      const loadFunction = externalLoadPatientFiles || loadPatientFiles
      const files = await loadFunction(patientId)
      setAllFiles(files)
    }
  }

  const getTagLabel = (tagValue: string): string => {
    const tag = TAG_OPTIONS.find((t) => t.value === tagValue)
    return tag ? tag.label : tagValue
  }

  const filteredFiles = allFiles
    .filter((file) => file.patientId === patientId)
    .filter((file) => (tagFilter ? file.tag === tagFilter : true))
    .filter((file) => (searchQuery ? file.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))

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
            <Select value={tagFilter || "all"} onValueChange={(value) => setTagFilter(value === "all" ? null : value)}>
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
