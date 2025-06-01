import { db } from "../../lib/db"; // Importar la conexión desde db.ts
import type { FileItem } from ".";

// Función para generar URL de vista previa para un archivo
export function generatePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// Obtener archivos de un paciente
export async function loadPatientFiles(patientId: string) {
  const res = await fetch(`/api/archivos?patientId=${patientId}`);
  if (!res.ok) throw new Error("Error al cargar archivos");
  return res.json();
}

// Guardar archivo
const saveFileItem = async (file: FileItem): Promise<any> => {
  try {
    const formData = new FormData()
    formData.append("file", file.file)
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
    // Devuelve la respuesta del backend (que incluye el file con el id real)
    return await response.json()
  } catch (error) {
    console.error("Error saving file:", error)
    throw error
  }
}

// Eliminar archivo
export async function deleteFileItem(patientId: string, fileId: string) {
  const res = await fetch(`/api/archivos?id=${fileId}&patientId=${patientId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar archivo");
  return res.json();
}

// Función para actualizar la etiqueta de un archivo en la base de datos
export async function updateFileTag(patientId: string, fileId: string, newTag: string): Promise<void> {
  const res = await fetch(`/api/archivos?patientId=${patientId}&id=${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag: newTag }),
  });
  if (!res.ok) throw new Error("Error al actualizar etiqueta");
  console.log(`Etiqueta actualizada para el archivo: ${fileId}`);
}

// Función para renombrar un archivo en la base de datos
export async function renameFileItem(patientId: string, fileId: string, newName: string): Promise<void> {
  const res = await fetch(`/api/archivos?patientId=${patientId}&id=${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error("Error al renombrar archivo");
  console.log(`Archivo renombrado en la base de datos: ${fileId}`);
}
