"use client"

import * as XLSX from "xlsx"
import type { StudentStatus } from "@/lib/types"

/*
 * =========================================================
 * PLANTILLA DESCARGABLE
 * =========================================================
 */

const HEADERS = ["Numero Documento", "Nombre", "Apellido", "Correo", "Contraseña", "Estado"]

const EXAMPLE_ROW = [
  "121212121",
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

  return rows
    .slice(1)
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
}

/*
 * =========================================================
 * DETECTAR DOCUMENTOS REPETIDOS
 * =========================================================
 */

export function flagDuplicateDocuments(
  rows: ParsedStudentRow[],
  existingDocuments: string[] = [],
): ParsedStudentRow[] {
  const existingSet = new Set(existingDocuments.map((d) => normalizeDocumentNumber(d).toLowerCase()))
  const seenInFile = new Map<string, number>()

  return rows.map((row) => {
    if (!row.documentNumber) return row

    const key = normalizeDocumentNumber(row.documentNumber).toLowerCase()
    const errors = [...row.errors]

    if (existingSet.has(key)) {
      errors.push("Este documento ya está registrado en el evento")
    }

    if (seenInFile.has(key)) {
      errors.push(`Documento duplicado en el archivo (ya aparece en la fila ${seenInFile.get(key)})`)
    } else {
      seenInFile.set(key, row.row)
    }

    return errors.length === row.errors.length ? row : { ...row, errors }
  })
}
