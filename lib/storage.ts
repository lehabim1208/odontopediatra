import { encryptData, decryptData } from "./crypto"

/**
 * Utilidad para almacenar y recuperar datos del localStorage con cifrado
 */
export const storage = {
  /**
   * Guarda un valor en localStorage
   * @param key Clave para almacenar
   * @param value Valor a almacenar (se cifrará si es información médica)
   */
  setItem: (key: string, value: any) => {
    try {
      // Determinar si el valor debe ser cifrado (información médica)
      const shouldEncrypt =
        key === "patients" || key.includes("medical") || key.includes("health") || key.includes("treatment")

      const valueToStore = shouldEncrypt ? encryptData(value) : JSON.stringify(value)

      localStorage.setItem(key, valueToStore)

      // Marcar las claves cifradas para saber cómo recuperarlas
      if (shouldEncrypt) {
        const encryptedKeys = JSON.parse(localStorage.getItem("__encrypted_keys") || "[]")
        if (!encryptedKeys.includes(key)) {
          encryptedKeys.push(key)
          localStorage.setItem("__encrypted_keys", JSON.stringify(encryptedKeys))
        }
      }
    } catch (error) {
      console.error("Error al guardar en localStorage:", error)
    }
  },

  /**
   * Recupera un valor de localStorage
   * @param key Clave a recuperar
   * @returns Valor recuperado y descifrado si es necesario
   */
  getItem: (key: string) => {
    try {
      const value = localStorage.getItem(key)
      if (!value) return null

      // Verificar si la clave está marcada como cifrada
      const encryptedKeys = JSON.parse(localStorage.getItem("__encrypted_keys") || "[]")
      const isEncrypted = encryptedKeys.includes(key)

      return isEncrypted ? decryptData(value) : JSON.parse(value)
    } catch (error) {
      console.error("Error al recuperar de localStorage:", error)
      return null
    }
  },

  /**
   * Elimina un valor de localStorage
   * @param key Clave a eliminar
   */
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)

      // Actualizar lista de claves cifradas
      const encryptedKeys = JSON.parse(localStorage.getItem("__encrypted_keys") || "[]")
      const updatedKeys = encryptedKeys.filter((k: string) => k !== key)
      localStorage.setItem("__encrypted_keys", JSON.stringify(updatedKeys))
    } catch (error) {
      console.error("Error al eliminar de localStorage:", error)
    }
  },

  /**
   * Limpia todo el localStorage
   */
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("Error al limpiar localStorage:", error)
    }
  },
}
