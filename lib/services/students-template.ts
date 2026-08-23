"use client"

import * as XLSX from "xlsx"
import type { StudentStatus } from "@/lib/types"

const HEADERS = ["Documento", "Nombre", "Apellido", "Correo", "Contraseña", "Estado"]
const EXAMPLE_ROW = [
  "EJEMPLO-BORRAR-ESTA-FILA",
  "Juana",
  "Pérez",
  "juana.perez@email.com",
  "Foto2026!",
  "Pendiente",
]

export function downloadStudentTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
  ]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes")
  XLSX.writeFile(workbook, "plantilla-estudiantes.xlsx")
}

export interface ParsedStudentRow {
  row: number
  documentNumber: string
  firstName: string
  lastName: string
  email: string | null
  password: string
  status: StudentStatus
  errors: string[]
}

const STATUS_MAP: Record<string, StudentStatus> = {
  "": "PENDING",
  "pendiente": "PENDING",
  "en proceso": "SELECTION_IN_PROGRESS",
  "selección en progreso": "SELECTION_IN_PROGRESS",
  "seleccion en progreso": "SELECTION_IN_PROGRESS",
  "enviado": "SELECTION_SENT",
  "selección enviada": "SELECTION_SENT",
  "seleccion enviada": "SELECTION_SENT",
}

function normalizeDocumentNumber(value: string) {
  const trimmed = value.trim()
  return /^[\d.\-\s]+$/.test(trimmed) ? trimmed.replace(/\D/g, "") : trimmed
}

export async function parseStudentFile(file: File): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error("El archivo no contiene una hoja válida.")

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    raw: false,
  })

  const parsed = rows.slice(1)
    .map((cols, index) => {
      const values = [0, 1, 2, 3, 4, 5].map((i) => (cols[i] ?? "").toString().trim())
      const [documentRaw, firstName, lastName, email, password, status] = values
      const documentNumber = normalizeDocumentNumber(documentRaw)
      const errors: string[] = []

      if (!documentNumber && !firstName && !lastName && !email && !password && !status) return null
      if (documentNumber === "EJEMPLO-BORRAR-ESTA-FILA") return null

      if (!documentNumber) errors.push("Falta el documento")
      if (!firstName) errors.push("Falta el nombre")
      if (!lastName) errors.push("Falta el apellido")
      if (!password) errors.push("Falta la contraseña")
      if (password && password.length < 6) errors.push("La contraseña debe tener mínimo 6 caracteres")

      const normalizedStatus = STATUS_MAP[status.toLowerCase()]
      if (status && !normalizedStatus) {
        errors.push(`Estado "${status}" no reconocido (usa: Pendiente, En proceso o Enviado)`)
      }

      return {
        row: index + 2,
        documentNumber,
        firstName,
        lastName,
        email: email || null,
        password,
        status: normalizedStatus ?? "PENDING",
        errors,
      } satisfies ParsedStudentRow
    })
    .filter((row): row is ParsedStudentRow => row !== null)

  const counts = new Map<string, number>()
  for (const row of parsed) counts.set(row.documentNumber, (counts.get(row.documentNumber) || 0) + 1)

  return parsed.map((row) =>
    row.documentNumber && (counts.get(row.documentNumber) || 0) > 1
      ? { ...row, errors: [...row.errors, "El documento está repetido en el archivo"] }
      : row,
  )
}
