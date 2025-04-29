"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TreatmentRow {
  id: string
  toothNumber: string
  conventionalTreatment: string
  recommendedTreatment: string
  conventionalPrice: number
  recommendedPrice: number
}

interface TreatmentTableProps {
  initialRows?: TreatmentRow[]
  onUpdate: (rows: TreatmentRow[]) => void
}

// Modificar la función TreatmentTable para verificar si hay tratamientos válidos
export function TreatmentTable({ initialRows, onUpdate }: TreatmentTableProps) {
  const [rows, setRows] = useState<TreatmentRow[]>(
    initialRows || [
      {
        id: Date.now().toString(),
        toothNumber: "",
        conventionalTreatment: "",
        recommendedTreatment: "",
        conventionalPrice: 0,
        recommendedPrice: 0,
      },
    ],
  )

  const [conventionalTotal, setConventionalTotal] = useState(0)
  const [recommendedTotal, setRecommendedTotal] = useState(0)

  useEffect(() => {
    // Calculate totals
    const cTotal = rows.reduce((sum, row) => sum + (row.conventionalPrice || 0), 0)
    const rTotal = rows.reduce((sum, row) => sum + (row.recommendedPrice || 0), 0)

    setConventionalTotal(cTotal)
    setRecommendedTotal(rTotal)

    // Notify parent component
    onUpdate(rows)
  }, [rows, onUpdate])

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        toothNumber: "",
        conventionalTreatment: "",
        recommendedTreatment: "",
        conventionalPrice: 0,
        recommendedPrice: 0,
      },
    ])
  }

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof TreatmentRow, value: string | number) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value }
        }
        return row
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Órgano dentario</TableHead>
              <TableHead>Tratamiento convencional</TableHead>
              <TableHead>Tratamiento recomendado</TableHead>
              <TableHead className="w-[200px]">Precio (Conv./Recom.)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.toothNumber}
                    onChange={(e) => updateRow(row.id, "toothNumber", e.target.value)}
                    placeholder="Ej: 55"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.conventionalTreatment}
                    onChange={(e) => updateRow(row.id, "conventionalTreatment", e.target.value)}
                    placeholder="Ej: Resina/fdp"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.recommendedTreatment}
                    onChange={(e) => updateRow(row.id, "recommendedTreatment", e.target.value)}
                    placeholder="Ej: Resina/ionomero de vidrio"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={row.conventionalPrice || ""}
                        onChange={(e) => updateRow(row.id, "conventionalPrice", Number(e.target.value))}
                        placeholder="$"
                        className="w-full"
                      />
                    </div>
                    <span>/</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={row.recommendedPrice || ""}
                        onChange={(e) => updateRow(row.id, "recommendedPrice", Number(e.target.value))}
                        placeholder="$"
                        className="w-full"
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={rows.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Total del tratamiento convencional
              </TableCell>
              <TableCell colSpan={2} className="font-bold">
                ${conventionalTotal.toLocaleString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Total del tratamiento recomendado
              </TableCell>
              <TableCell colSpan={2} className="font-bold">
                ${recommendedTotal.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" onClick={addRow} className="flex items-center gap-1">
        <Plus className="h-4 w-4" /> Agregar fila
      </Button>
    </div>
  )
}
