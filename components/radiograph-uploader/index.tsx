"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilePreview } from "@/components/file-preview"
import { generatePreviewUrl } from "./storage-service"
import { v4 as uuidv4 } from "uuid"
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  File,
  MoreHorizontal,
  Tag,
  Download,
  Trash,
  Pencil,
  Maximize,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export interface TagOption {
  value: string
  label: string
}

export interface FileItem {
  id: string
  name: string
  type: string
  size: number
  url: string
  tag: string
  uploadDate: string
  patientId: string
  filePath?: string
  description?: string // Agregar campo para la descripción
}

interface RadiographUploaderProps {
  title?: string
  onFileAdded?: (file: FileItem) => void
  onFileRemoved?: (fileId: string) => void
  onTagUpdate?: (fileId: string, newTag: string) => void
  onRenameFile?: (fileId: string, newName: string) => void
  tagOptions?: TagOption[]
  defaultTag?: string
  initialFiles?: FileItem[]
  showFileCount?: boolean
  patientId: string
}

export function RadiographUploader({
  title = "Documentos",
  onFileAdded,
  onFileRemoved,
  onTagUpdate,
  onRenameFile,
  tagOptions = [],
  defaultTag = "",
  initialFiles = [],
  showFileCount = true,
  patientId,
}: RadiographUploaderProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [previewFile, setPreviewFile] = useState<{ file: File | null; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  // Estados para modales
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)

  // Estados para el formulario de carga
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>("")
  const [uploadTag, setUploadTag] = useState<string>(defaultTag)
  const [uploadDescription, setUploadDescription] = useState<string>("") // Estado para la descripción
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Estado para renombrar
  const [newFileName, setNewFileName] = useState<string>("")

  // Estado para zoom
  const [zoomLevel, setZoomLevel] = useState(100)

  // Actualizar la lista de archivos cuando cambian los initialFiles
  useEffect(() => {
    setFiles(initialFiles)
  }, [initialFiles])

  // Efecto para seleccionar el primer archivo si no hay ninguno seleccionado
  useEffect(() => {
    if (initialFiles.length > 0 && !selectedFile) {
      handleViewFile(initialFiles[0])
    }
  }, [initialFiles, selectedFile])

  const handleUploadModalOpen = () => {
    setUploadFile(null)
    setUploadPreviewUrl("")
    setUploadTag(defaultTag)
    setUploadDescription("") // Limpiar la descripción al abrir el modal
    setUploadError(null)
    setShowUploadModal(true)
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndSetFile(file)
    }
  }, [])

  const validateAndSetFile = (file: File) => {
    setUploadError(null)

    // Validar tipo de archivo (imágenes y PDF)
    const validTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Solo se permiten archivos de imagen (JPEG, PNG, GIF) y PDF")
      return false
    }

    // Validar tamaño de archivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB en bytes
    if (file.size > maxSize) {
      setUploadError("El archivo no debe exceder 5MB")
      return false
    }

    // Generar URL para vista previa
    const fileUrl = generatePreviewUrl(file)

    // Preparar el archivo para subir, no añadirlo a la lista todavía
    setUploadFile(file)
    setUploadPreviewUrl(fileUrl)
    return true
  }

  const handleUploadSubmit = () => {
    if (!uploadFile) return

    // Crear objeto de archivo para la lista
    const newFile: FileItem = {
      id: uuidv4(),
      name: uploadFile.name,
      type: uploadFile.type,
      size: uploadFile.size,
      url: uploadPreviewUrl,
      tag: uploadTag,
      uploadDate: new Date().toISOString(),
      patientId: patientId,
      description: uploadDescription, // Guardar la descripción
    }

    // Actualizar estado y notificar al componente padre
    setFiles((prev) => [newFile, ...prev])
    setSelectedFile(newFile)
    setPreviewFile({ file: uploadFile, url: uploadPreviewUrl })
    if (onFileAdded) onFileAdded(newFile)

    // Cerrar modal
    setShowUploadModal(false)

    toast({
      title: "Documento subido",
      description: "El documento se ha subido correctamente",
      variant: "success",
      duration: 3000,
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  const handleRemoveFile = useCallback((fileId: string) => {
    setFileToDelete(fileId)
    setShowDeleteConfirmModal(true)
  }, [])

  const confirmDeleteFile = useCallback(() => {
    if (!fileToDelete) return

    // Si es el archivo en vista previa, limpiar la vista previa
    if (selectedFile && selectedFile.id === fileToDelete) {
      setSelectedFile(null)
      setPreviewFile(null)
    }

    // Actualizar estado y notificar al componente padre
    setFiles((prev) => prev.filter((f) => f.id !== fileToDelete))
    if (onFileRemoved) onFileRemoved(fileToDelete)

    // Cerrar modal y limpiar
    setShowDeleteConfirmModal(false)
    setFileToDelete(null)

    toast({
      title: "Documento eliminado",
      description: "El documento se ha eliminado correctamente",
      variant: "success",
      duration: 3000,
    })
  }, [fileToDelete, selectedFile, onFileRemoved])

  const handleTagChange = useCallback(
    (fileId: string, newTag: string) => {
      // Actualizar estado
      setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, tag: newTag } : file)))

      // Actualizar archivo seleccionado si es necesario
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile({ ...selectedFile, tag: newTag })
      }

      // Notificar al componente padre
      if (onTagUpdate) onTagUpdate(fileId, newTag)
    },
    [selectedFile, onTagUpdate],
  )

  const handleRenameFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId)
    if (file) {
      setNewFileName(file.name)
      setSelectedFile(file)
      setShowRenameModal(true)
    }
  }

  const handleRenameSubmit = () => {
    if (!selectedFile || !newFileName.trim()) return

    // Actualizar estado
    setFiles((prev) => prev.map((file) => (file.id === selectedFile.id ? { ...file, name: newFileName } : file)))

    // Actualizar archivo seleccionado
    setSelectedFile({ ...selectedFile, name: newFileName })

    // Notificar al componente padre
    if (onRenameFile) onRenameFile(selectedFile.id, newFileName)

    // Cerrar modal
    setShowRenameModal(false)

    toast({
      title: "Documento renombrado",
      description: "El documento se ha renombrado correctamente",
      variant: "success",
      duration: 3000,
    })
  }

  const handleViewFile = useCallback((file: FileItem) => {
    setSelectedFile(file)
    setZoomLevel(100) // Resetear zoom al cambiar de archivo

    // Crear un objeto para la vista previa
    // No usamos el constructor File para evitar errores
    setPreviewFile({
      file: null, // No necesitamos el objeto File real para la vista previa
      url: file.url,
    })
  }, [])

  const handleDownloadFile = (file: FileItem) => {
    // En una implementación real, esto descargaría el archivo
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    link.click()
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType === "application/pdf") return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getTagColor = (tag: string): string => {
    const tagMap: Record<string, string> = {
      radiografia: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "examen-sangre": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      receta: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      indicaciones: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      informe: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      otro: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    }

    return tagMap[tag] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel izquierdo: Lista de archivos y carga */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
              {showFileCount && <Badge variant="outline">{files.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Botón de carga */}
              <div className="flex justify-center">
                <Button onClick={handleUploadModalOpen} className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Subir documento
                </Button>
              </div>

              {/* Lista de archivos */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No hay documentos cargados</div>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className={`border rounded-lg p-3 flex justify-between items-center hover:bg-muted/50 transition-colors cursor-pointer ${
                          selectedFile?.id === file.id ? "bg-muted/50 border-primary" : ""
                        }`}
                        onClick={() => handleViewFile(file)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate max-w-[180px]">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{format(new Date(file.uploadDate), "d MMM yyyy", { locale: es })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={`${getTagColor(file.tag)}`}>
                            {tagOptions.find((t) => t.value === file.tag)?.label || file.tag}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadFile(file)
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" /> Descargar
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRenameFile(file.id)
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Renombrar
                              </DropdownMenuItem>

                              {tagOptions.length > 0 && (
                                <>
                                  <DropdownMenuItem className="font-medium text-xs opacity-50 cursor-default">
                                    <Tag className="h-3 w-3 mr-1" /> Cambiar etiqueta
                                  </DropdownMenuItem>
                                  {tagOptions.map((tag) => (
                                    <DropdownMenuItem
                                      key={tag.value}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleTagChange(file.id, tag.value)
                                      }}
                                      className={file.tag === tag.value ? "bg-muted" : ""}
                                    >
                                      {tag.label}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveFile(file.id)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Panel derecho: Vista previa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex justify-between items-center">
              <span>Vista previa</span>
              <div className="flex items-center gap-2">
                {selectedFile && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomOut}
                      title="Reducir zoom"
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium">{zoomLevel}%</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleZoomIn}
                      title="Aumentar zoom"
                      disabled={zoomLevel >= 300}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowFullPreviewModal(true)}
                      title="Ver en pantalla completa"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFile && previewFile ? (
              <div className="space-y-4">
                <FilePreview
                  fileType={selectedFile.type}
                  fileUrl={previewFile.url}
                  maxHeight={400}
                  zoomLevel={zoomLevel}
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{selectedFile.name}</h3>
                    <Badge className={`${getTagColor(selectedFile.tag)}`}>
                      {tagOptions.find((t) => t.value === selectedFile.tag)?.label || selectedFile.tag}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Tamaño: {formatFileSize(selectedFile.size)}</p>
                    <p>
                      Subido: {format(new Date(selectedFile.uploadDate), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                    </p>
                    {selectedFile.description && (
                      <p className="mt-2">
                        <span className="font-medium">Descripción:</span> {selectedFile.description}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleRemoveFile(selectedFile.id)}>
                      <Trash className="mr-2 h-4 w-4" /> Eliminar
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleRenameFile(selectedFile.id)}>
                      <Pencil className="mr-2 h-4 w-4" /> Renombrar
                    </Button>

                    <Button size="sm" onClick={() => handleDownloadFile(selectedFile)}>
                      <Download className="mr-2 h-4 w-4" /> Descargar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Seleccione un documento</h3>
                <p className="text-muted-foreground">Seleccione un documento de la lista para ver su contenido</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de carga de archivos */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>Seleccione un archivo para subir y asigne una categoría</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Tipo de documento</Label>
              <Select value={uploadTag} onValueChange={setUploadTag}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tagOptions.map((tag) => (
                    <SelectItem key={tag.value} value={tag.value}>
                      {tag.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-description">Descripción</Label>
              <Textarea
                id="document-description"
                placeholder="Agregar una descripción al documento"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            {uploadError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <div
              ref={dropAreaRef}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,application/pdf"
              />

              {uploadFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    {getFileIcon(uploadFile.type)}
                  </div>
                  <p className="font-medium">{uploadFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Arrastre un archivo aquí o haga clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Soporta JPG, JPEG, PNG y PDF (máx. 5MB)</p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadSubmit} disabled={!uploadFile}>
              Subir archivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de vista previa en pantalla completa */}
      <Dialog open={showFullPreviewModal} onOpenChange={setShowFullPreviewModal}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setShowFullPreviewModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {selectedFile && previewFile && (
              <div className="max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-center gap-2 p-2 bg-background/80 absolute top-2 left-2 z-10 rounded-md">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    title="Reducir zoom"
                    disabled={zoomLevel <= 50}
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium">{zoomLevel}%</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    title="Aumentar zoom"
                    disabled={zoomLevel >= 300}
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <FilePreview
                  fileType={selectedFile.type}
                  fileUrl={previewFile.url}
                  maxHeight={window.innerHeight * 0.8}
                  zoomLevel={zoomLevel}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para renombrar archivo */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renombrar documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-name">Nuevo nombre</Label>
              <Input
                id="file-name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Ingrese el nuevo nombre del archivo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!newFileName.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFile}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
