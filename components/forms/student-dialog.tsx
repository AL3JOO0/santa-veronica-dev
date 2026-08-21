'use client'

import * as React from 'react'

import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Label,
} from '@/components/ui/label'

import type {
  Student,
  StudentStatus,
} from '@/lib/types'

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  eventId: string

  student?: Student | null

  onSaved?: () => void | Promise<void>

  onCreate: (
    student: {
      eventId: string
      documentNumber: string
      firstName: string
      lastName: string
      email: string | null
      status: StudentStatus
    },
  ) => Promise<unknown>
onUpdate?: (
  id: string,
  student: {
    documentNumber?: string
    firstName?: string
    lastName?: string
    email?: string | null
    status?: StudentStatus
  },
) => Promise<unknown>
}

export function StudentDialog({
  open,
  onOpenChange,
  eventId,
  student,
  onSaved,
  onCreate,
  onUpdate,
}: StudentDialogProps) {
  const editing = !!student

  const [documentNumber, setDocumentNumber] =
    React.useState('')

  const [firstName, setFirstName] =
    React.useState('')

  const [lastName, setLastName] =
    React.useState('')

  const [email, setEmail] =
    React.useState('')

  const [status, setStatus] =
  React.useState<StudentStatus>('PENDING')

  const [saving, setSaving] =
    React.useState(false)

  React.useEffect(() => {
    if (!open) {
      return
    }

    setDocumentNumber(
      student?.documentNumber ?? '',
    )

    setFirstName(
      student?.firstName ?? '',
    )

    setLastName(
      student?.lastName ?? '',
    )

    setEmail(
      student?.email ?? '',
    )

    setStatus(
  student?.status ?? 'PENDING',
)
  }, [open, student])

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!documentNumber.trim()) {
      toast.error(
        'El documento es obligatorio.',
      )
      return
    }

    if (!firstName.trim()) {
      toast.error(
        'El nombre es obligatorio.',
      )
      return
    }

    if (!lastName.trim()) {
      toast.error(
        'El apellido es obligatorio.',
      )
      return
    }

    try {
      setSaving(true)

      if (editing && student && onUpdate) {
        await onUpdate(student.id, {
          documentNumber:
            documentNumber.trim(),

          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          email:
            email.trim() || null,

          status,
        })

        toast.success(
          'Estudiante actualizado correctamente.',
        )
      } else {
        await onCreate({
          eventId,

          documentNumber:
            documentNumber.trim(),

          firstName:
            firstName.trim(),

          lastName:
            lastName.trim(),

          email:
            email.trim() || null,

          status,
        })

        toast.success(
          'Estudiante agregado correctamente.',
        )
      }

      await onSaved?.()

      onOpenChange(false)
    } catch (error) {
      console.error(
        'Error guardando estudiante:',
        error,
      )

      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el estudiante.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? 'Editar estudiante'
              : 'Agregar estudiante'}
          </DialogTitle>

          <DialogDescription>
            {editing
              ? 'Actualiza la información del estudiante.'
              : 'Registra un estudiante en este evento.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="documentNumber">
              Documento
            </Label>

            <Input
              id="documentNumber"
              value={documentNumber}
              onChange={(event) =>
                setDocumentNumber(
                  event.target.value,
                )
              }
              placeholder="Número de documento"
              disabled={saving}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">
                Nombre
              </Label>

              <Input
                id="firstName"
                value={firstName}
                onChange={(event) =>
                  setFirstName(
                    event.target.value,
                  )
                }
                placeholder="Nombre"
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">
                Apellido
              </Label>

              <Input
                id="lastName"
                value={lastName}
                onChange={(event) =>
                  setLastName(
                    event.target.value,
                  )
                }
                placeholder="Apellido"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">
              Correo electrónico
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="correo@ejemplo.com"
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="status">
              Estado
            </Label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
  setStatus(
    event.target.value as StudentStatus,
  )
}
              disabled={saving}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="PENDING">
  Pendiente
</option>

<option value="SELECTION_IN_PROGRESS">
  Selección en progreso
</option>

<option value="SELECTION_SENT">
  Selección enviada
</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Guardando...'
                : editing
                  ? 'Guardar cambios'
                  : 'Agregar estudiante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}