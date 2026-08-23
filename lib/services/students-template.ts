"use client"

import * as XLSX from "xlsx"
import type { StudentStatus } from "@/lib/types"

/*
 * =========================================================
 * PLANTILLA DESCARGABLE
 * =========================================================
 */

const HEADERS = ["Documento", "Nombre", "Apellido", "Correo", "Estado"]

const EXAMPLE_ROW = [
  "EJEMPLO-BORRAR-ESTA-FILA",
  "Juana",
  "Pérez",
  "juana.perez@email.com",
  "Pendiente",
]

export function downloadStudentTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])

  // Anchos de columna legibles
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes")

  XLSX.writeFile(workbook, "plantilla-estudiantes.xlsx")
}

/*
 * =========================================================
 * PARSEAR Y VALIDAR EL ARCHIVO SUBIDO
 * =========================================================
 */

export interface ParsedStudentRow {
  row: number
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  status: StudentStatus
  errors: string[]
}

const STATUS_MAP: Record<string, StudentStatus> = {
  "": "PENDING",
  "pendiente": "PENDING",
  "en proceso": "SELECTION_IN_PROGRESS",
  "enviado": "SELECTION_SENT",
}

export async function parseStudentFile(
  file: File
): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  })

  // La primera fila son los encabezados, la saltamos.
  const dataRows = rows.slice(1)

  return dataRows.map((cols, index) => {
    const [documentNumber, firstName, lastName, email, status] = [
      0, 1, 2, 3, 4,
    ].map((i) => (cols[i] ?? "").toString().trim())

    const errors: string[] = []

    if (!documentNumber) errors.push("Falta el documento")
    if (!firstName) errors.push("Falta el nombre")
    if (!lastName) errors.push("Falta el apellido")

    const normalizedStatus = STATUS_MAP[status.toLowerCase()]
    if (status && !normalizedStatus) {
      errors.push(
        `Estado "${status}" no reconocido (usa: Pendiente, En proceso o Enviado)`
      )
    }

    return {
      row: index + 2, // +2: fila 1 es encabezado, index empieza en 0
      documentNumber,
      firstName,
      lastName,
      email: email || null,
      status: normalizedStatus ?? "PENDING",
      errors,
    }
  })
}