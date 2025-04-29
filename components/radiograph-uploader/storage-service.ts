import type { FileItem } from "."

// Función para generar URL de vista previa para un archivo
export function generatePreviewUrl(file: File): string {
  // En un entorno real, esto subiría el archivo al servidor y devolvería la URL
  // Para esta implementación, usamos URL.createObjectURL para generar una URL local
  return URL.createObjectURL(file)
}

// Función para cargar archivos de un paciente
export async function loadPatientFiles(patientId: string): Promise<FileItem[]> {
  // En un entorno real, esto haría una petición al servidor
  // Para esta implementación, usamos localStorage
  try {
    const filesKey = `patient_files_${patientId}`
    const storedFiles = localStorage.getItem(filesKey)

    if (storedFiles) {
      return JSON.parse(storedFiles)
    }

    return []
  } catch (error) {
    console.error("Error al cargar archivos:", error)
    return []
  }
}

// Función para guardar un archivo
export async function saveFileItem(file: FileItem): Promise<void> {
  try {
    // En un entorno real, esto subiría el archivo al servidor
    // Para esta implementación, simulamos la persistencia en localStorage

    // 1. Guardar el archivo en la estructura de archivos del paciente
    const filesKey = `patient_files_${file.patientId}`
    const storedFiles = localStorage.getItem(filesKey)
    let files: FileItem[] = storedFiles ? JSON.parse(storedFiles) : []

    // 2. Añadir el nuevo archivo
    files = [file, ...files]

    // 3. Guardar la lista actualizada
    localStorage.setItem(filesKey, JSON.stringify(files))

    // 4. En un entorno real, aquí se guardaría el archivo físico en el servidor
    // Simular la ruta del archivo en el servidor
    const filePath = `/archivos/${file.patientId}/${file.id}_${file.name}`
    console.log(`Archivo guardado en: ${filePath}`)

    // Nota: En un entorno real, aquí se usaría una API para subir el archivo al servidor
    // Por ejemplo:
    // const formData = new FormData();
    // formData.append('file', actualFile);
    // formData.append('patientId', file.patientId);
    // await fetch('/api/upload', { method: 'POST', body: formData });
  } catch (error) {
    console.error("Error al guardar archivo:", error)
    throw error
  }
}

// Función para eliminar un archivo
export async function deleteFileItem(patientId: string, fileId: string): Promise<void> {
  try {
    // 1. Obtener la lista de archivos
    const filesKey = `patient_files_${patientId}`
    const storedFiles = localStorage.getItem(filesKey)

    if (!storedFiles) return

    let files: FileItem[] = JSON.parse(storedFiles)

    // 2. Encontrar el archivo a eliminar
    const fileToDelete = files.find((f) => f.id === fileId)

    if (!fileToDelete) return

    // 3. Eliminar el archivo de la lista
    files = files.filter((f) => f.id !== fileId)

    // 4. Guardar la lista actualizada
    localStorage.setItem(filesKey, JSON.stringify(files))

    // 5. En un entorno real, aquí se eliminaría el archivo físico del servidor
    console.log(`Archivo eliminado: ${fileToDelete.name}`)

    // Nota: En un entorno real, aquí se usaría una API para eliminar el archivo del servidor
    // Por ejemplo:
    // await fetch(`/api/files/${patientId}/${fileId}`, { method: 'DELETE' });
  } catch (error) {
    console.error("Error al eliminar archivo:", error)
    throw error
  }
}

// Función para actualizar la etiqueta de un archivo
export async function updateFileTag(patientId: string, fileId: string, newTag: string): Promise<void> {
  try {
    // 1. Obtener la lista de archivos
    const filesKey = `patient_files_${patientId}`
    const storedFiles = localStorage.getItem(filesKey)

    if (!storedFiles) return

    let files: FileItem[] = JSON.parse(storedFiles)

    // 2. Actualizar la etiqueta del archivo
    files = files.map((file) => (file.id === fileId ? { ...file, tag: newTag } : file))

    // 3. Guardar la lista actualizada
    localStorage.setItem(filesKey, JSON.stringify(files))

    // Nota: En un entorno real, aquí se usaría una API para actualizar la etiqueta en el servidor
    // Por ejemplo:
    // await fetch(`/api/files/${patientId}/${fileId}/tag`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tag: newTag })
    // });
  } catch (error) {
    console.error("Error al actualizar etiqueta:", error)
    throw error
  }
}

// Función para renombrar un archivo
export async function renameFileItem(patientId: string, fileId: string, newName: string): Promise<void> {
  try {
    // 1. Obtener la lista de archivos
    const filesKey = `patient_files_${patientId}`
    const storedFiles = localStorage.getItem(filesKey)

    if (!storedFiles) return

    let files: FileItem[] = JSON.parse(storedFiles)

    // 2. Actualizar el nombre del archivo
    files = files.map((file) => (file.id === fileId ? { ...file, name: newName } : file))

    // 3. Guardar la lista actualizada
    localStorage.setItem(filesKey, JSON.stringify(files))

    // Nota: En un entorno real, aquí se usaría una API para renombrar el archivo en el servidor
    // Por ejemplo:
    // await fetch(`/api/files/${patientId}/${fileId}/rename`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name: newName })
    // });
  } catch (error) {
    console.error("Error al renombrar archivo:", error)
    throw error
  }
}
