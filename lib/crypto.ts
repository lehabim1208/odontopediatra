/**
 * Utilidad para cifrar y descifrar datos sensibles
 */

// Clave de cifrado (en una aplicación real, esto debería ser más seguro)
const ENCRYPTION_KEY = "dental-clinic-secure-encryption-key-2024"

/**
 * Cifra un objeto o string para almacenamiento seguro
 * @param data Datos a cifrar
 * @returns Datos cifrados como string
 */
export function encryptData(data: any): string {
  try {
    // Convertir a string si es un objeto
    const dataString = typeof data === "string" ? data : JSON.stringify(data)

    // Cifrado simple (en producción usar algo más robusto como Web Crypto API)
    // Este es un cifrado básico para demostración
    const encrypted = btoa(
      encodeURIComponent(dataString)
        .split("")
        .map((char, index) => {
          const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length)
          return String.fromCharCode(char.charCodeAt(0) + (keyChar % 10))
        })
        .join(""),
    )

    return encrypted
  } catch (error) {
    console.error("Error al cifrar datos:", error)
    return ""
  }
}

/**
 * Descifra datos previamente cifrados
 * @param encryptedData Datos cifrados
 * @returns Datos descifrados (objeto o string)
 */
export function decryptData(encryptedData: string): any {
  try {
    // Descifrar
    const decrypted = decodeURIComponent(
      atob(encryptedData)
        .split("")
        .map((char, index) => {
          const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length)
          return String.fromCharCode(char.charCodeAt(0) - (keyChar % 10))
        })
        .join(""),
    )

    // Intentar parsear como JSON
    try {
      return JSON.parse(decrypted)
    } catch {
      // Si no es JSON, devolver como string
      return decrypted
    }
  } catch (error) {
    console.error("Error al descifrar datos:", error)
    return null
  }
}
