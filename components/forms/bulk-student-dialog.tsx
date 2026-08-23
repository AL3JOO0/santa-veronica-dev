'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import {
  downloadStudentTemplate,
  parseStudentFile,
  flagDuplicateDocuments,
  type ParsedStudentRow,
} from '@/lib/services/students-template'

import type { BulkCreateStudentInput } from '@/lib/services/students.service'

interface BulkStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  eventId: string

  /*
   * Documentos ya registrados en este evento, para detectar
   * duplicados contra la base de datos (no solo dentro del archivo).
   */
  existingDocuments?: string[]

  onBulkCreate: (
    students: BulkCreateStudentInput[],
  ) => Promise<unknown>

  onSaved?: () => void | Promise<void>
}

export function BulkStudentDialog({
  open,
  onOpenChange,
  eventId,
  existingDocuments = [],
  onBulkCreate,
  onSaved,
}: BulkStudentDialogProps) {
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [rows, setRows] = React.useState<ParsedStudentRow[]>([])
  const [parsing, setParsing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)

  const validRows = rows.filter((r) => r.errors.length === 0)
  const invalidRows = rows.filter((r) => r.errors.length > 0)

  /*
   * Reiniciar estado cada vez que se abre el diálogo.
   */
  React.useEffect(() => {
    if (!open) return
    setFileName(null)
    setRows([])
  }, [open])

  async function handleFile(file: File | null) {
    if (!file) return

    setFileName(file.name)
    setParsing(true)

    try {
      const parsed = await parseStudentFile(file)
      const flagged = flagDuplicateDocuments(parsed, existingDocuments)
      setRows(flagged)

      if (parsed.length === 0) {
        toast.error('El archivo no tiene filas de datos.')
      }
    } catch (error) {
      console.error('Error leyendo el archivo:', error)
      toast.error(
        'No se pudo leer el archivo. Verifica que sea un .xlsx válido.',
      )
      setFileName(null)
      setRows([])
    } finally {
      setParsing(false)
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return

    try {
      setSaving(true)

      await onBulkCreate(
        validRows.map((row) => ({
          eventId,
          documentNumber: row.documentNumber,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          status: row.status,
        })),
      )

      toast.success(
        `${validRows.length} estudiante${validRows.length !== 1 ? 's' : ''} importado${validRows.length !== 1 ? 's' : ''} correctamente.`,
      )

      await onSaved?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error importando estudiantes:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudieron importar los estudiantes.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar estudiantes desde Excel</DialogTitle>
          <DialogDescription>
            Descarga la plantilla, complétala y súbela para registrar
            varios estudiantes a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* PASO 1: DESCARGAR PLANTILLA */}
          <Button
            type="button"
            variant="outline"
            onClick={downloadStudentTemplate}
            disabled={saving}
          >
            <Download className="mr-2 size-4" />
            Descargar plantilla (.xlsx)
          </Button>

          {/* PASO 2: SUBIR ARCHIVO */}
          <div
            onClick={() => !saving && inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors hover:border-primary/50"
          >
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">
              {fileName ?? 'Haz clic para seleccionar tu archivo completado'}
            </p>
            <p className="text-xs text-muted-foreground">
              Solo archivos .xlsx
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) =>
                handleFile(e.target.files?.[0] ?? null)
              }
            />
          </div>

          {/* PASO 3: RESUMEN DE VALIDACIÓN */}
          {parsing && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Leyendo archivo...
            </p>
          )}

          {!parsing && rows.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <span>
                  <strong className="text-foreground">
                    {validRows.length}
                  </strong>{' '}
                  fila{validRows.length !== 1 && 's'} lista
                  {validRows.length !== 1 && 's'} para importar
                </span>
              </div>

              {invalidRows.length > 0 && (
                <div className="flex flex-col gap-1 border-t pt-2">
                  <p className="text-xs font-medium text-destructive">
                    {invalidRows.length} fila
                    {invalidRows.length !== 1 && 's'} con errores (no se
                    importarán):
                  </p>
                  <ul className="max-h-28 overflow-y-auto text-xs text-muted-foreground">
                    {invalidRows.slice(0, 10).map((row) => (
                      <li key={row.row}>
                        Fila {row.row}: {row.errors.join(', ')}
                      </li>
                    ))}
                    {invalidRows.length > 10 && (
                      <li>...y {invalidRows.length - 10} más.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleImport}
            disabled={saving || validRows.length === 0}
          >
            {saving
              ? 'Importando...'
              : `Importar ${validRows.length || ''} estudiante${validRows.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}