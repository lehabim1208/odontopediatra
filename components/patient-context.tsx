"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface PatientContextType {
  selectedPatientId: string | null
  setSelectedPatientId: (id: string | null) => void
  navigateToOdontogram: (patientId: string) => void
}

const PatientContext = createContext<PatientContextType | undefined>(undefined)

export function PatientProvider({ children }: { children: ReactNode }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const router = useRouter()

  const navigateToOdontogram = (patientId: string) => {
    setSelectedPatientId(patientId)
    router.push("/odontograma")
  }

  return (
    <PatientContext.Provider value={{ selectedPatientId, setSelectedPatientId, navigateToOdontogram }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const context = useContext(PatientContext)
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider")
  }
  return context
}
