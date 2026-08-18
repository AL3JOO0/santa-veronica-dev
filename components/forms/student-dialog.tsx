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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStore } from '@/lib/store'
import type { Status, Student } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  eventId: string
}

export function StudentDialog({ open, onOpenChange, student, eventId }: Props) {
  const store = useStore()
  const editing = Boolean(student)

  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [code, setCode] = React.useState('')
  const [program, setProgram] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<Status>('activo')

  React.useEffect(() => {
    if (open) {
      setFirstName(student?.firstName ?? '')
      setLastName(student?.lastName ?? '')
      setCode(student?.code ?? '')
      setProgram(student?.program ?? '')
      setEmail(student?.email ?? '')
      setStatus(student?.status ?? 'activo')
    }
  }, [open, student])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim())
      return toast.error('Nombre y apellidos son obligatorios')
    if (!code.trim()) return toast.error('El documento/código es obligatorio')

    const payload = {
      eventId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      code: code.trim(),
      program: program.trim(),
      email: email.trim(),
      status,
    }
    if (editing && student) {
      store.updateStudent(student.id, payload)
      toast.success('Estudiante actualizado')
    } else {
      store.addStudent(payload)
      toast.success('Estudiante agregado')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar estudiante' : 'Nuevo estudiante'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Actualiza la información del estudiante.'
                : 'Agrega un estudiante a este evento.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="st-first">Nombre</FieldLabel>
                <Input
                  id="st-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="st-last">Apellidos</FieldLabel>
                <Input
                  id="st-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="st-code">Documento / Código</FieldLabel>
              <Input
                id="st-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="20261234"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="st-program">Programa</FieldLabel>
              <Input
                id="st-program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Ingeniería de Sistemas"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="st-email">Correo</FieldLabel>
              <Input
                id="st-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.edu"
              />
            </Field>
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="archivado">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editing ? 'Guardar cambios' : 'Agregar estudiante'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
